"use client";

import React from "react";
import CourseCard from "./PricingColumn";
import { courses } from "@/data/pricing";

const Courses: React.FC = () => {
  return (
    <div
      className="
        max-w-7xl 
        mx-auto 
        px-4 
        py-12 
        bg-gradient-to-r 
        from-white 
        via-indigo-50 
        to-white 
        rounded-lg 
        shadow-lg
      "
    >
      <h2 className="text-4xl font-bold text-center mb-10 text-gray-900">
        Descoperea cursurile noastre
      </h2>
      {/* Display courses in a responsive grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {courses.map((course) => (
          <CourseCard key={course.name} course={course} />
        ))}
      </div>
    </div>
  );
};

export default Courses;
