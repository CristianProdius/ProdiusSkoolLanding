"use client";

import { BsFillCheckCircleFill } from "react-icons/bs";
import { ICourse } from "@/types";

interface Props {
  course: ICourse;
}

const CourseCard: React.FC<Props> = ({ course }) => {
  const { name, price, features } = course;

  return (
    <div
      className="
        w-full
        bg-white
        rounded-xl
        border
        border-gray-200
        shadow-md
        overflow-hidden
        hover:shadow-xl
        transition-shadow
      "
    >
      {/* Header / Title / Price */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-2xl font-semibold mb-2">{name}</h3>
        <p className="text-3xl md:text-4xl font-bold mb-4 text-secondary">
          {price} RON
        </p>
        <button
          onClick={() => (window.location.href = "/book")}
          className="
            w-full 
            py-3 
            px-4 
            rounded-full 
            font-semibold 
            bg-primary 
            hover:bg-primary-accent
            text-black 
            transition-colors
          "
        >
          Înscrie-te acum
        </button>
      </div>

      {/* Feature List */}
      <div className="p-6">
        <p className="font-bold mb-1">CE PRIMEȘTI</p>
        <p className="text-foreground-accent mb-4">
          Lista de beneficii pentru acest curs:
        </p>
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center text-gray-700">
              <BsFillCheckCircleFill className="h-5 w-5 text-secondary mr-2" />
              {feature}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default CourseCard;
