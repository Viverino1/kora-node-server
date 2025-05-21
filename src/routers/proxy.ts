import axios from "axios";
import { Router } from "express";
import { animePaheBaseURL, baseURL, port } from "../server.js";

const router = Router();

router.get("/proxy/pahe", async (req, res) => {
  const url = typeof req.query.url === "string" && decodeURIComponent(req.query.url);
  if (!url) {
    return res.status(400).send("URL parameter is required");
  }

  try {
    const response = await axios.get(url, {
      responseType: "stream", // Important for images and binary data
      headers: {
        // Add any custom headers you need
        Referer: animePaheBaseURL,
      },
    });

    // Set all response headers except CORS-related
    for (const [key, value] of Object.entries(response.headers)) {
      if (!["access-control-allow-origin", "access-control-allow-methods", "access-control-allow-headers", "access-control-expose-headers"].includes(key.toLowerCase())) {
        res.setHeader(key, value);
      }
    }

    // Pipe the stream directly to the response
    response.data.pipe(res);
  } catch (error) {
    console.error("Proxy error:", error);
    res.status(500).send("Error fetching resource.");
  }
});

router.get("/proxy", async (req, res) => {
  const url = typeof req.query.url == "string" && decodeURIComponent(req.query.url);
  if (!url) {
    return res.status(400).send("URL parameter is required");
  }
  try {
    const response = await axios.get(url);
    let data = response.data;

    // Forward headers from the request to the response, excluding CORS headers
    Object.keys(response.headers).forEach((header) => {
      if (!["access-control-allow-origin", "access-control-allow-methods", "access-control-allow-headers", "access-control-expose-headers"].includes(header.toLowerCase())) {
        res.setHeader(header, response.headers[header]);
      }
    });

    // Rewrite the key URI line
    data = data.replace(/#EXT-X-KEY:METHOD=AES-128,URI="([^"]+)"/, (match: string, p1: string) => {
      return `#EXT-X-KEY:METHOD=AES-128,URI="${baseURL}:${port}/proxy/key?url=${encodeURIComponent(p1)}"`;
    });

    data = data.replace(/https?:\/\/.*?\.jpg/g, (match: string) => {
      const segmentName = match.split("/").pop();
      const url = segmentName && match.replace(segmentName, "");
      return url && `${baseURL}:${port}/proxy/segment/${segmentName}?url=${encodeURIComponent(url)}`;
    });

    res.send(data);
  } catch (error) {
    res.status(500).send("Error fetching and rewriting m3u8");
  }
});

router.get("/proxy/key", async (req, res) => {
  const url = typeof req.query.url == "string" && decodeURIComponent(req.query.url);
  if (!url) {
    return res.status(400).send("URL parameter is required");
  }
  try {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    Object.keys(response.headers).forEach((header) => {
      if (!["access-control-allow-origin", "access-control-allow-methods", "access-control-allow-headers", "access-control-expose-headers"].includes(header.toLowerCase())) {
        res.setHeader(header, response.headers[header]);
      }
    });

    res.send(response.data);
  } catch (error) {
    res.status(500).send("Error fetching and rewriting key");
  }
});

router.get("/proxy/segment/:id", async (req, res) => {
  const id = req.params.id;
  if (!id) {
    return res.status(400).send("Segment ID is required");
  }
  const url = typeof req.query.url == "string" && decodeURIComponent(req.query.url);
  if (!url) {
    return res.status(400).send("URL parameter is required");
  }
  const segmentUrl = `${decodeURIComponent(url)}${id}`;
  try {
    const response = await axios.get(segmentUrl, { responseType: "arraybuffer" });
    Object.keys(response.headers).forEach((header) => {
      if (!["access-control-allow-origin", "access-control-allow-methods", "access-control-allow-headers", "access-control-expose-headers"].includes(header.toLowerCase())) {
        res.setHeader(header, response.headers[header]);
      }
    });

    res.send(response.data);
  } catch (error) {
    res.status(500).send("Error fetching and rewriting segment");
  }
});

export default router;
