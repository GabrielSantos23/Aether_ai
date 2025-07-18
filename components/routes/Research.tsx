import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ResearchPage() {
  const researchReports = useQuery(api.research.getUserResearchReports) || [];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Research Reports</h1>
      <Card>
        <CardHeader>
          <CardTitle>PDFs</CardTitle>
        </CardHeader>
        <CardContent>
          {researchReports.length === 0 ? (
            <div className="text-gray-500">No research reports found.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {researchReports.map((report: any, i: number) => (
                <a
                  key={i}
                  href={report.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block border rounded p-2 hover:shadow"
                >
                  <div className="font-medium mb-1">{report.prompt}</div>
                  <div className="text-xs text-gray-500 mb-2">
                    {new Date(report.createdAt).toLocaleString()}
                  </div>
                  <div className="text-blue-600 underline">Open PDF</div>
                </a>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
