"use client";

import { useEffect, useState } from "react";
import { Star } from "lucide-react";

const REPO = "Mohitkumar2217/CouldShary";

export function GithubStarButton() {
  const [stars, setStars] = useState<number | null>(null);

  useEffect(() => {
    fetch(`https://api.github.com/repos/${REPO}`)
      .then((res) => res.json())
      .then((data) => setStars(data.stargazers_count ?? null))
      .catch(() => setStars(null));
  }, []);

  return (
    <a
      href={`https://github.com/${REPO}`}
      target="_blank"
      rel="noopener noreferrer"
      className=" inline-flex items-center gap-2 rounded-md border border-black bg-white px-3 py-1.5 text-sm font-medium text-black transition-all duration-200 hover:bg-black hover:text-white " >
      <Star className="h-4 w-4" />
      <span>Star</span>
      {stars !== null && (
        <span className="border-l border-black/20 pl-2">
          {stars}
        </span>
      )}
    </a>
  );
}