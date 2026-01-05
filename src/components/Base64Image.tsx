export const Base64Image: React.FC<{
  base64?: string | null;
  alt: string;
  className?: string;
  fallbackType?: "character" | "scene" | "poster";
}> = ({ base64, alt, className, fallbackType = "scene" }) => {
  const [error, setError] = useState(false);

  if (!base64 || error) {
    return <ImagePlaceholder type={fallbackType} />;
  }

  return (
    <img
      src={`data:image/png;base64,${base64}`}
      alt={alt}
      className={className}
      onError={() => setError(true)}
    />
  );
};
