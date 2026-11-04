import { motion } from "framer-motion";
import GreetingCard from "./GreetingCard";
import type { GreetingData } from "../../types/greeting";

interface Props {
  greeting: GreetingData;
}

export default function GreetingPreview({ greeting }: Props) {
  return (
    <div className="preview-area">
      <motion.div
        key={greeting.template}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <GreetingCard greeting={greeting} />
      </motion.div>
    </div>
  );
}
