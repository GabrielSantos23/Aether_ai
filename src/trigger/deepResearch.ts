// @ts-nocheck
import { task } from "@trigger.dev/sdk/v3";
import { eventTrigger } from "@trigger.dev/sdk";
import { PDFDocument, StandardFonts } from "pdf-lib";

/**
 * Deep research task powered by Trigger.dev v3.
 * Listens for the `deep.research.requested` event (emitted by Convex) and
 * orchestrates the multi-stage research → PDF → Upload flow.
 */
export const deepResearch = task({
  id: "deep-research",
  trigger: eventTrigger({ name: "deep.research.requested" }),
  async run(payload, ctx) {
    const { query, depth, userId } = payload as {
      query: string;
      depth: number;
      userId: string;
    };

    // 1. Recursive research (placeholder – replace with your own logic)
    const notes: string[] = [];
    let prompt = query;
    for (let i = 0; i < (depth ?? 3); i++) {
      const step = i + 1;
      prompt = `Step ${step}/${depth}: ${prompt}`;
      // TODO: Integrate real LLM / search API. For now, generate placeholder.
      notes.push(`Results for ${prompt}...`);
    }

    // 2. Build markdown report
    const mdLines = [`# Deep Research Report`, `**Topic:** ${query}`, ""];
    notes.forEach((n, idx) => {
      mdLines.push(`## Layer ${idx + 1}`, n, "");
    });
    const markdown = mdLines.join("\n");

    // 3. Convert to PDF (quick implementation)
    // Generate PDF
    const doc = await PDFDocument.create();
    let page = doc.addPage();
    const { width, height } = page.getSize();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const lines = markdown.split("\n");
    const lineHeight = 14;
    let cursorY = height - 50;
    for (const line of lines) {
      if (cursorY < 50) {
        page = doc.addPage();
        cursorY = height - 50;
      }
      page.drawText(line, { x: 50, y: cursorY, size: 12, font });
      cursorY -= lineHeight;
    }
    const pdfBytes = await doc.save();

    // 4. Upload via UploadThing
    const res = await fetch("https://uploadthing.com/api/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/pdf",
        "x-uploadthing-api-key": process.env.UPLOADTHING_TOKEN,
        "x-uploadthing-version": "5",
        "x-uploadthing-slug": "pdfUploader",
      },
      body: Buffer.from(pdfBytes),
    });
    if (!res.ok) throw new Error(await res.text());
    const uploadResp = (await res.json()) as { url: string };

    // 5. Return
    return { pdfUrl: uploadResp.url };
  },
});
