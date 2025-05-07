// src/context/EducationContext.jsx
"use client";
import { createContext, useContext, useState, useEffect } from "react";

const EducationLevelContext = createContext({
  educationLevel: "beginner",
  setEducationLevel: () => {},
  autoDetectLevel: true,
  setAutoDetectLevel: () => {},
  conceptsViewed: {},
  markConceptViewed: () => {},
});

export function EducationLevelProvider({ children }) {
  const [educationLevel, setEducationLevel] = useState("beginner");
  const [autoDetectLevel, setAutoDetectLevel] = useState(true);
  const [conceptsViewed, setConceptsViewed] = useState({});

  // Mark a concept as viewed and count how many times
  const markConceptViewed = (concept) => {
    setConceptsViewed((prev) => ({
      ...prev,
      [concept]: (prev[concept] || 0) + 1,
    }));
  };

  // Auto-detect education level based on user interactions
  useEffect(() => {
    if (!autoDetectLevel) return;

    const conceptCount = Object.keys(conceptsViewed).length;
    const totalViews = Object.values(conceptsViewed).reduce(
      (sum, count) => sum + count,
      0
    );

    if (conceptCount > 15 || totalViews > 30) {
      setEducationLevel("advanced");
    } else if (conceptCount > 5 || totalViews > 10) {
      setEducationLevel("intermediate");
    } else {
      setEducationLevel("beginner");
    }
  }, [conceptsViewed, autoDetectLevel]);

  return (
    <EducationLevelContext.Provider
      value={{
        educationLevel,
        setEducationLevel,
        autoDetectLevel,
        setAutoDetectLevel,
        conceptsViewed,
        markConceptViewed,
      }}
    >
      {children}
    </EducationLevelContext.Provider>
  );
}

export const useEducationLevel = () => useContext(EducationLevelContext);
