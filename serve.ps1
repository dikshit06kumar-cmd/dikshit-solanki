Add-Type -TypeDefinition @"
using System;
using System.IO;
using System.Net;
using System.Threading;
using System.Text.RegularExpressions;

public class MicroServer {
    private HttpListener listener;
    private string root;
    private bool running = false;
    private static readonly object fileLock = new object();

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

    private static string ExtractString(string json, string key) {
        var m = Regex.Match(json, "\"" + key + "\"\\s*:\\s*\"([^\"]*)\"");
        return m.Success ? m.Groups[1].Value : "";
    }

    private static int ExtractInt(string json, string key, int def) {
        var m = Regex.Match(json, "\"" + key + "\"\\s*:\\s*(\\d+)");
        int val = def;
        if (m.Success && int.TryParse(m.Groups[1].Value, out val)) {
            return val;
        }
        return def;
    }

    private static string SanitizeText(string s) {
        if (string.IsNullOrEmpty(s)) return "";
        return s.Replace("\\", "\\\\")
                .Replace("\"", "\\\"")
                .Replace("<", "&lt;")
                .Replace(">", "&gt;")
                .Replace("\r", "")
                .Replace("\n", " ")
                .Trim();
    }

    private void Process(object state) {
        var ctx = (HttpListenerContext)state;
        try {
            string method = ctx.Request.HttpMethod.ToUpperInvariant();
            ctx.Response.Headers.Add("Access-Control-Allow-Origin", "*");
            ctx.Response.Headers.Add("Access-Control-Allow-Methods", "GET, POST, HEAD, OPTIONS");
            ctx.Response.Headers.Add("Access-Control-Allow-Headers", "Content-Type");

            if (method == "OPTIONS") {
                ctx.Response.StatusCode = 200;
                ctx.Response.OutputStream.Close();
                return;
            }

            string path = ctx.Request.Url.AbsolutePath;

            // API: Feedback endpoint
            if (path.Equals("/api/feedback", StringComparison.OrdinalIgnoreCase)) {
                string feedbackFile = Path.Combine(root, "feedback.json");
                ctx.Response.ContentType = "application/json; charset=utf-8";
                ctx.Response.Headers.Add("Cache-Control", "no-cache, no-store, must-revalidate");

                if (method == "GET") {
                    string jsonContent = "[]";
                    lock (fileLock) {
                        if (File.Exists(feedbackFile)) {
                            jsonContent = File.ReadAllText(feedbackFile);
                        }
                    }
                    byte[] data = System.Text.Encoding.UTF8.GetBytes(jsonContent);
                    ctx.Response.ContentLength64 = data.Length;
                    ctx.Response.StatusCode = 200;
                    ctx.Response.OutputStream.Write(data, 0, data.Length);
                    return;
                } else if (method == "POST") {
                    string body = "";
                    using (var reader = new StreamReader(ctx.Request.InputStream, System.Text.Encoding.UTF8)) {
                        body = reader.ReadToEnd();
                    }

                    // Anti-spam Honeypot check
                    string botCheck = ExtractString(body, "bot_check");
                    if (!string.IsNullOrEmpty(botCheck)) {
                        // Reject bot silently
                        ctx.Response.StatusCode = 400;
                        byte[] err = System.Text.Encoding.UTF8.GetBytes("{\"error\":\"Spam detected\"}");
                        ctx.Response.OutputStream.Write(err, 0, err.Length);
                        return;
                    }

                    string name = SanitizeText(ExtractString(body, "name"));
                    string comment = SanitizeText(ExtractString(body, "comment"));
                    int rating = ExtractInt(body, "rating", 5);
                    if (rating < 1) rating = 1;
                    if (rating > 5) rating = 5;

                    if (name.Length < 2 || comment.Length < 5) {
                        ctx.Response.StatusCode = 400;
                        byte[] err = System.Text.Encoding.UTF8.GetBytes("{\"error\":\"Name (min 2 chars) and Comment (min 5 chars) are required.\"}");
                        ctx.Response.OutputStream.Write(err, 0, err.Length);
                        return;
                    }

                    if (name.Length > 60) name = name.Substring(0, 60);
                    if (comment.Length > 500) comment = comment.Substring(0, 500);

                    string id = "fb_" + DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
                    string isoDate = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ");

                    string newItemJson = "  {\n" +
                        "    \"id\": \"" + id + "\",\n" +
                        "    \"name\": \"" + name + "\",\n" +
                        "    \"comment\": \"" + comment + "\",\n" +
                        "    \"rating\": " + rating + ",\n" +
                        "    \"createdAt\": \"" + isoDate + "\",\n" +
                        "    \"isCommunity\": true\n" +
                        "  }";

                    lock (fileLock) {
                        string existing = "[]";
                        if (File.Exists(feedbackFile)) {
                            existing = File.ReadAllText(feedbackFile).Trim();
                        }
                        if (existing.StartsWith("[") && existing.EndsWith("]")) {
                            string inner = existing.Substring(1, existing.Length - 2).Trim();
                            string updated;
                            if (string.IsNullOrEmpty(inner)) {
                                updated = "[\n" + newItemJson + "\n]\n";
                            } else {
                                updated = "[\n" + newItemJson + ",\n" + inner + "\n]\n";
                            }
                            File.WriteAllText(feedbackFile, updated, System.Text.Encoding.UTF8);
                        } else {
                            File.WriteAllText(feedbackFile, "[\n" + newItemJson + "\n]\n", System.Text.Encoding.UTF8);
                        }
                    }

                    string respJson = "{\"success\":true,\"message\":\"Feedback submitted successfully!\",\"item\":" + newItemJson.Trim() + "}";
                    byte[] respBytes = System.Text.Encoding.UTF8.GetBytes(respJson);
                    ctx.Response.StatusCode = 201;
                    ctx.Response.ContentLength64 = respBytes.Length;
                    ctx.Response.OutputStream.Write(respBytes, 0, respBytes.Length);
                    return;
                }
            }

            // Static files serving
            if (path == "/") path = "/index.html";
            string fullPath = Path.Combine(root, path.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));

            if (File.Exists(fullPath)) {
                string ext = Path.GetExtension(fullPath).ToLowerInvariant();
                string mime = "application/octet-stream";
                if (ext == ".html") mime = "text/html; charset=utf-8";
                else if (ext == ".css") mime = "text/css; charset=utf-8";
                else if (ext == ".js") mime = "application/javascript; charset=utf-8";
                else if (ext == ".json") mime = "application/json; charset=utf-8";
                else if (ext == ".jpg" || ext == ".jpeg") mime = "image/jpeg";
                else if (ext == ".png") mime = "image/png";
                else if (ext == ".webp") mime = "image/webp";
                else if (ext == ".pdf") mime = "application/pdf";
                else if (ext == ".mp4") mime = "video/mp4";
                else if (ext == ".svg") mime = "image/svg+xml";

                ctx.Response.ContentType = mime;
                if (ext != ".json") {
                    ctx.Response.Headers.Add("Cache-Control", "public, max-age=3600");
                } else {
                    ctx.Response.Headers.Add("Cache-Control", "no-cache");
                }

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
