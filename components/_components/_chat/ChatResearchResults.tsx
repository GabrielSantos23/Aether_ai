import { motion } from "framer-motion";
import { DeepResearch } from "@/components/_components/_tools/deep-research/deep-research";

export type ChatResearchResultsProps = {
  id: string;
  annotations?: any[]; // placeholder for now
  done?: boolean;
  request?: any; // compatibility if direct result passed
};

export function ChatResearchResults({
  id,
  annotations = [],
  done = true,
  request,
}: ChatResearchResultsProps) {
  // If request is passed, use it; otherwise try to derive from annotations
  const researchRequest =
    request || (annotations.length > 0 ? annotations[0] : null);

  if (!researchRequest) {
    return null;
  }

  return (
    <motion.div
      key={id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <DeepResearch request={researchRequest} />
    </motion.div>
  );
}

export default ChatResearchResults;
