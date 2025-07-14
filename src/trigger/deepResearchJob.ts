// @ts-nocheck
import { TriggerClient, eventTrigger } from "@trigger.dev/sdk";
import { PDFDocument, StandardFonts } from "pdf-lib";

const client = new TriggerClient({ id: "deep-research-agent" });

/**
 * We listen for the `deep.research.requested` event (emitted via the Convex
 * action) and orchestrate a multi-step research workflow:
 * 1. Iteratively query the web and an LLM to build a comprehensive report.
 * 2. Compile the report into a PDF.
 * 3. Upload the PDF to your existing `pdfUploader` UploadThing route.
 * 4. Return the public URL so the front-end can display a download link.
 *
 * ➡️  This implementation purposefully keeps the heavy logic out of the main
 *     repo to minimise bundle size. Feel free to adapt/inline functionality.
 */
client.defineJob({
  id: "deep-research",
  name: "Deep Research Agent",
  version: "0.1.0",
  trigger: eventTrigger({ name: "deep.research.requested" }),
  run: async (payload, io, ctx) => {
    const { query, depth, userId } = payload as {
      query: string;
      depth: number;
      userId: string;
    };

    // -----------------------------------------------------------------------
    // 1️⃣  Multi-layered research (very simplified – customise as needed)
    // -----------------------------------------------------------------------
    const thoughts: string[] = [];
    let currentPrompt = query;
    for (let i = 0; i < depth; i++) {
      const step = i + 1;
      currentPrompt = `Step ${step}/${depth} – Research on: "${currentPrompt}"\n\nProvide a structured summary (bullet points, key facts, sources).`;

      // Call your preferred LLM via the Vercel AI SDK (this example uses GPT-4o)
      const response = await io.runTask(`LLM step ${step}`, async () => {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) throw new Error("Missing GEMINI_API_KEY env var");

        const endpoint =
          "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=" +
          apiKey;

        const body = {
          contents: [
            {
              parts: [{ text: currentPrompt }],
            },
          ],
        };

        const res = await fetch(endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          throw new Error(await res.text());
        }

        const data = await res.json();
        const text =
          data.candidates?.[0]?.content?.parts?.[0]?.text ??
          JSON.stringify(data);
        return text as string;
      });

      thoughts.push(response.trim());
    }

    // -----------------------------------------------------------------------
    // 2️⃣  Compile markdown report
    // -----------------------------------------------------------------------
    const md = [`# Deep Research Report`, `**Topic:** ${query}`, ``];
    thoughts.forEach((t, idx) => {
      md.push(`## Layer ${idx + 1}`, t, ``);
    });

    const markdownReport = md.join("\n");

    // -----------------------------------------------------------------------
    // 3️⃣  Convert markdown → PDF (quick & dirty – uses pdf-lib)
    // -----------------------------------------------------------------------
    const pdf = await io.runTask("generate-pdf", async () => {
      const doc = await PDFDocument.create();
      let page = doc.addPage();
      const { width, height } = page.getSize();
      const font = await doc.embedFont(StandardFonts.Helvetica);
      const fontSize = 12;
      const lines = markdownReport.split("\n");
      const lineHeight = 14;
      let cursorY = height - 50;
      for (const line of lines) {
        if (cursorY < 50) {
          page = doc.addPage();
          cursorY = height - 50;
        }
        page.drawText(line, {
          x: 50,
          y: cursorY,
          size: fontSize,
          font,
        });
        cursorY -= lineHeight;
      }
      return await doc.save();
    });

    // -----------------------------------------------------------------------
    // 4️⃣  Upload PDF via UploadThing
    // -----------------------------------------------------------------------
    const uploadRes = await io.runTask("upload-pdf", async () => {
      const uploadResponse = await fetch("https://uploadthing.com/api/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/pdf",
          "x-uploadthing-api-key": process.env.UPLOADTHING_TOKEN,
          "x-uploadthing-version": "5",
          "x-uploadthing-slug": "pdfUploader",
        },
        body: Buffer.from(pdf),
      });

      if (!uploadResponse.ok) {
        throw new Error(await uploadResponse.text());
      }
      return (await uploadResponse.json()) as { url: string };
    });

    // -----------------------------------------------------------------------
    // 5️⃣  Return the public URL so Convex can show it
    // -----------------------------------------------------------------------
    return { pdfUrl: uploadRes.url };
  },
});

export default client;
