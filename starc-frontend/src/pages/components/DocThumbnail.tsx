import Image from "next/image";
import documentIcon from "../../assets/document-icon.svg";
import trashIcon from "../../assets/trash-icon.svg";

// TODO: declare here to?
interface DocThumbnailProps {
  id: number;
  title: string;
  wordCount: number;
  onDelete: (id: number) => void;
}

export default function DocThumbnail({
  id,
  title,
  wordCount,
  onDelete,
}: DocThumbnailProps) {
  const handleDelete = (id: number) => {
    onDelete(id);
  };

  return (
    <div
      className="flex h-124 w-250 cursor-pointer flex-col space-y-24 rounded-lg border border-gray-20 bg-white pb-16 pl-24 pr-24 pt-16"
    >
      <div className="flex justify-between">
        <Image 
          src={documentIcon as string} 
          alt="document icon" 
          width={24}
          height={24}
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(id);
          }}
          className="cursor-pointer"
        >
          <Image 
            src={trashIcon as string} 
            alt="trash icon"
            width={24}
            height={24}
          />
        </button>
      </div>
      <div className="flex flex-col">
        <div className="text-m_1 font-medium">{title}</div>
        <div className="text-sm_2 font-normal">{wordCount}</div>
      </div>
    </div>
  );
}
