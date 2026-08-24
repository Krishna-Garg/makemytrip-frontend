import { Star } from "lucide-react";

interface Props {
  value: number; // current rating (0–5)
  onChange?: (v: number) => void; // if provided → interactive
  size?: "sm" | "md" | "lg";
}

const sizes = { sm: "w-4 h-4", md: "w-5 h-5", lg: "w-7 h-7" };

export default function StarRating({ value, onChange, size = "md" }: Props) {
  const cls = sizes[size];
  return (
    <div className="flex items-center space-x-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(star)}
          className={onChange ? "cursor-pointer" : "cursor-default"}
        >
          <Star
            className={`${cls} transition-colors ${
              star <= value
                ? "fill-yellow-400 text-yellow-400"
                : "fill-none text-gray-300"
            }`}
          />
        </button>
      ))}
    </div>
  );
}
