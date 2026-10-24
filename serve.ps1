Add-Type -TypeDefinition @"
using System;
using System.IO;
using System.Net;
using System.Threading;

public class MicroServer {
    private HttpListener listener;
    private string root;
    private bool running = false;

    public void Start(int port, string rootDir) {
        root = rootDir;
        listener = new HttpListener();
        listener.Prefixes.Add("http://localhost:" + port + "/");
        listener.Prefixes.Add("http://127.0.0.1:" + port + "/");
        listener.Start();
        running = true;
        Console.WriteLine("Server running at http://localhost:" + port + "/");
        ThreadPool.QueueUserWorkItem(Listen);
    }

    private void Listen(object state) {
        while (running) {
            try {
                var ctx = listener.GetContext();
                ThreadPool.QueueUserWorkItem(Process, ctx);
            } catch { }
        }
    }

    private void Process(object state) {
        var ctx = (HttpListenerContext)state;
        try {
            string method = ctx.Request.HttpMethod.ToUpperInvariant();
            ctx.Response.Headers.Add("Access-Control-Allow-Origin", "*");
            ctx.Response.Headers.Add("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");

            if (method == "OPTIONS") {
                ctx.Response.StatusCode = 200;
                ctx.Response.OutputStream.Close();
                return;
            }

            string path = ctx.Request.Url.AbsolutePath;
            if (path == "/") path = "/index.html";
            string fullPath = Path.Combine(root, path.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));

            if (File.Exists(fullPath)) {
                string ext = Path.GetExtension(fullPath).ToLowerInvariant();
                string mime = "application/octet-stream";
                if (ext == ".html") mime = "text/html; charset=utf-8";
                else if (ext == ".css") mime = "text/css; charset=utf-8";
                else if (ext == ".js") mime = "application/javascript; charset=utf-8";
                else if (ext == ".jpg" || ext == ".jpeg") mime = "image/jpeg";
                else if (ext == ".png") mime = "image/png";
                else if (ext == ".pdf") mime = "application/pdf";
                else if (ext == ".mp4") mime = "video/mp4";
                else if (ext == ".svg") mime = "image/svg+xml";

                ctx.Response.ContentType = mime;
                ctx.Response.Headers.Add("Cache-Control", "public, max-age=3600");
                byte[] data = File.ReadAllBytes(fullPath);
                ctx.Response.ContentLength64 = data.Length;
                ctx.Response.StatusCode = 200;

                if (method != "HEAD") {
                    ctx.Response.OutputStream.Write(data, 0, data.Length);
                }
            } else {
                ctx.Response.StatusCode = 404;
            }
        } catch {
            ctx.Response.StatusCode = 500;
        } finally {
            try { ctx.Response.OutputStream.Close(); } catch { }
        }
    }

    public void Stop() {
        running = false;
        if (listener != null) {
            try { listener.Stop(); } catch { }
            try { listener.Close(); } catch { }
        }
    }
}
"@

$port = 3000
$root = $PSScriptRoot
if (-not $root) { $root = (Get-Location).Path }

$server = New-Object MicroServer
$server.Start($port, $root)

Write-Host "Local server active at http://localhost:$port/"
Write-Host "Press Ctrl+C to stop."

while ($true) {
    Start-Sleep -Seconds 1
}
