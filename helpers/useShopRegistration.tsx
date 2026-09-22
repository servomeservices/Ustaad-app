import { useMutation, useQuery } from "@tanstack/react-query";
import { getQrArea } from "../endpoints/qr/area_GET.schema";
import { postShopPhotoUploadUrl } from "../endpoints/shops/photo-upload-url_POST.schema";
import { postRegisterShop, OutputType as Shop } from "../endpoints/shops/register_POST.schema";

export function useQrArea(areaCode: string | null) {
  return useQuery({
    queryKey: ["qr", "area", areaCode],
    queryFn: () => getQrArea({ code: areaCode as string }),
    enabled: !!areaCode,
    retry: false,
  });
}

type RegisterShopInput = {
  areaCode: string;
  shopName: string;
  ownerContact: string;
  photoFile: File;
  latitude: number | null;
  longitude: number | null;
};

// Uploads the geotagged shop photo directly to storage, then registers the
// shop record pointing at it. Two network round-trips, exposed as one
// mutation so the dispatcher page only has to deal with a single
// pending/error/success state.
export function useRegisterShop() {
  return useMutation({
    mutationFn: async (input: RegisterShopInput): Promise<Shop> => {
      const { presignedUrl, url } = await postShopPhotoUploadUrl({
        contentType: input.photoFile.type,
        sizeBytes: input.photoFile.size,
      });

      const putResult = await fetch(presignedUrl, {
        method: "PUT",
        headers: { "Content-Type": input.photoFile.type },
        body: input.photoFile,
      });
      if (!putResult.ok) {
        throw new Error("Could not upload the shop photo. Please try again.");
      }

      return postRegisterShop({
        areaCode: input.areaCode,
        shopName: input.shopName,
        ownerContact: input.ownerContact,
        photoUrl: url,
        latitude: input.latitude,
        longitude: input.longitude,
      });
    },
  });
}