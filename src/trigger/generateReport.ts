import { metadata, task } from "@trigger.dev/sdk/v3";
import { generateText } from "ai";
import { mainModel, getAIModel } from "./deepResearch";

const SYSTEM_PROMPT = `You are an expert researcher. Today is ${new Date().toISOString()}. Follow these instructions when responding:
  - You may be asked to research subjects that is after your knowledge cutoff, assume the user is right when presented with news.
  - The user is a highly experienced analyst, no need to simplify it, be as detailed as possible and make sure your response is correct.
  - Be highly organized.
  - Suggest solutions that I didn't think about.
  - Be proactive and anticipate my needs.
  - Treat me as an expert in all subject matter.
  - Mistakes erode my trust, so be accurate and thorough.  
  - Provide detailed explanations, I'm comfortable with lots of detail.
  - Value good arguments over authorities, the source is irrelevant.
  - Consider new technologies and contrarian ideas, not just the conventional wisdom.
  - You may use high levels of speculation or prediction, just flag it for me.
  
  STRUCTURE YOUR REPORT AS FOLLOWS:
  1. Executive Summary - Brief overview of key findings
  2. Introduction - Context and background of the research topic
  3. Methodology - How the research was conducted and sources evaluated
  4. Key Findings - Detailed analysis of discovered information, organized by themes
  5. Analysis and Implications - Critical evaluation, connections, and broader implications
  6. Recommendations - Actionable insights and suggested next steps
  7. Conclusion - Summary of main points and final thoughts
  8. Sources and References - Detailed source information

  - Ensure the "Sources and References" section is placed at the very end of the document so it appears at the bottom of the resulting PDF. List each source as a bullet point with the title hyperlinked to its URL.
  - Generate your response in clean HTML format with proper headings, paragraphs, lists, and formatting.
  - Use semantic HTML tags like <h1>, <h2>, <h3>, <p>, <ul>, <ol>, <blockquote>, <strong>, <em>.
  - Output ONLY the HTML content, do NOT wrap it in markdown code fences or backticks.
  - Start directly with HTML tags, not with \`\`\`html.
  - Create a comprehensive, professional research report that reads like an authoritative analysis.`;

export const generateReport = task({
  id: "generate-report",
  run: async (payload: { research: any; modelId?: string }) => {
    const research = payload.research;

    metadata.root.set("status", {
      progress: 0,
      label: "Generating report...",
    });

    const modelForReport = payload.modelId
      ? getAIModel(payload.modelId)
      : mainModel;

    const { text } = await generateText({
      model: modelForReport,
      prompt: `Research Query: "${research.query}"

Key Findings and Learnings:
${research.learnings
  .map(
    (learning: { learning: string; followUpQuestions: string[] }, i: number) =>
      `${i + 1}. ${learning.learning}
   Follow-up: ${learning.followUpQuestions.join(", ")}`
  )
  .join("\n\n")}

Here are the raw source documents to reference when writing the report. **Do NOT include them verbatim in the body** – instead, summarise their relevant insights in the Key Findings and Analysis sections, **then list each source (hyper-linked) in a dedicated "Sources and References" section positioned at the very end of the document**.

<sources>
${research.searchResults
  .map(
    (source: { title: string; url: string; content: string }, i: number) =>
      `${i + 1}. ${source.title}
URL: ${source.url}
Content Snippet: ${source.content.substring(0, 500)}...`
  )
  .join("\n\n")}
</sources>

Generate a comprehensive research report based on this complete research data. The final HTML **must** contain a section titled "Sources and References" as the very last element, formatted as a bullet list with each title hyper-linked to its URL. Output clean HTML that can be directly used in a document. Do NOT use markdown formatting or code fences – return pure HTML only.`,
      system: SYSTEM_PROMPT,
      maxTokens: 2000, // Limit output tokens
    });

    // Build a guaranteed Sources section
    const sourcesHtml = `\n<h2>Sources and References</h2>\n<ul>\n${research.searchResults
      .map(
        (s: { title: string; url: string }) =>
          `  <li><a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.title}</a></li>`
      )
      .join("\n")}\n</ul>`;

    let finalReport = text;
    if (!/Sources and References/i.test(text)) {
      // Append if section missing
      finalReport += sourcesHtml;
    }

    return { report: finalReport };
  },
});
