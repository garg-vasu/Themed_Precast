export default function PageHeader({
  title,
  ResponsivefontSize = false,
}: {
  title: string;
  ResponsivefontSize?: boolean;
}) {
  return (
    <div>
      {/* accent text color based on accent color  */}
      <h1
        className={` text-primary  font-semibold text-lg md:text-xl 
          
          `}
      >
        {title}
      </h1>
    </div>
  );
}
