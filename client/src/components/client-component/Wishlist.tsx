import { useWishlist } from "@/hooks/useWishlist";
import { useAuthModalStore } from "@/stores/useAuthModalStore";
import { ProductType } from "@/types/product.type";
import { User } from "@/types/user.type";
import { Heart } from "lucide-react";
import React from "react";

interface WishlistCompnent {
  user: User | null;
  productData: ProductType;
  price: number;
}

const Wishlist = ({ user, productData, price }: WishlistCompnent) => {
  const { openModal } = useAuthModalStore();

  const {
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    isAddingToWishlist,
  } = useWishlist();
  return (
    <button
      onClick={() => {
        if (!user) {
          openModal();
          return;
        }

        if (isInWishlist(productData?._id!)) {
          removeFromWishlist(productData?._id!);
        } else {
          addToWishlist({ productId: productData?._id!, price });
        }
      }}
      disabled={isAddingToWishlist}
      className="p-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
      aria-label="Add to wishlist"
    >
      <Heart
        size={24}
        className={`${
          isInWishlist(productData?._id!)
            ? "text-red-500 fill-current"
            : "text-gray-400"
        } transition-colors`}
      />
    </button>
  );
};

export default Wishlist;
