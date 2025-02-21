import React from "react";

interface MenuItemProps {
  image: string;
  title: string;
  description: string;
  price: string;
}

export const MenuItem: React.FC<MenuItemProps> = ({
  image,
  title,
  description,
  price,
}) => {
  return (
    <div className="border flex items-stretch gap-[38px] text-xs text-black mt-[26px] pl-2.5 pr-5 py-[5px] rounded-[15px] border-[rgba(51,51,51,1)] border-solid">
      <img
        loading="lazy"
        srcSet={image}
        alt={title}
        className="aspect-[1.19] object-contain w-[153px] shrink-0 max-w-full"
      />
      <div className="flex flex-col my-auto">
        <div className="text-[15px]">{title}</div>
        <div className="text-[10px] mt-2">{description}</div>
        <div className="mt-[7px]">{price}</div>
        <button className="bg-[rgba(71,62,29,1)] self-stretch text-[#010101] mt-[11px] px-[37px] py-[5px] rounded-[10px] max-md:px-5">
          Add to Cart
        </button>
      </div>
    </div>
  );
};
