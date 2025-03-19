// /data/stats.ts
import { FaGraduationCap, FaChalkboardTeacher } from "react-icons/fa";
import { BsCheckCircleFill } from "react-icons/bs";
import { IStats } from "@/types";

export const stats: IStats[] = [
  {
    title: "3.000+",
    icon: <FaGraduationCap size={34} className="text-primary" />,
    description:
      "Elevi au urmat cursurile noastre și au promovat cu note excelente.",
  },
  {
    title: "95%",
    icon: <BsCheckCircleFill size={34} className="text-green-600" />,
    description:
      "Rata de promovare la examenul național pentru studenții care finalizează programul.",
  },
  {
    title: "15+",
    icon: <FaChalkboardTeacher size={34} className="text-secondary" />,
    description:
      "Profesori cu experiență, gata să te ghideze pas cu pas spre succes.",
  },
];
