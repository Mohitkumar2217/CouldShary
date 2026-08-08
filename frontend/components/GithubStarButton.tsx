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
      .catch(() => setStars(null)); // fine if this fails — just hide the count
  }, []);

  return (
    <a
      href={`https://github.com/${REPO}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1.5 text-sm border rounded-md px-3 py-1.5 hover:bg-accent transition-colors"
    >
      <Star className="h-4 w-4" />
      <span>Star</span>
      {stars !== null && (
        <span className="text-xs text-muted-foreground border-l pl-1.5 ml-0.5">{stars}</span>
      )}
    </a>
  );
}