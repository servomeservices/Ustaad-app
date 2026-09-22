import React from "react";
import { useSearchParams } from "react-router-dom";
import { Camera, CheckCircle2, MapPin, QrCode, TriangleAlert } from "lucide-react";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { Skeleton } from "../components/Skeleton";
import { useQrArea, useRegisterShop } from "../helpers/useShopRegistration";
import styles from "./register-shop.module.css";

type GeoStatus = "idle" | "capturing" | "done" | "denied" | "unsupported";

function captureLocation(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new Error("unsupported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude });
      },
      () => reject(new Error("denied")),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  });
}

export default function RegisterShopPage() {
  const [searchParams] = useSearchParams();
  const areaCode = searchParams.get("area");

  const areaQuery = useQrArea(areaCode);
  const registerShop = useRegisterShop();

  const [shopName, setShopName] = React.useState("");
  const [ownerContact, setOwnerContact] = React.useState("");
  const [photoFile, setPhotoFile] = React.useState<File | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = React.useState<string | null>(null);
  const [geoStatus, setGeoStatus] = React.useState<GeoStatus>("idle");
  const [coords, setCoords] = React.useState<{ latitude: number; longitude: number } | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const onPhotoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoFile(file);
    setPhotoPreviewUrl(URL.createObjectURL(file));

    setGeoStatus("capturing");
    try {
      const location = await captureLocation();
      setCoords(location);
      setGeoStatus("done");
    } catch (err) {
      const message = (err as Error).message;
      setGeoStatus(message === "unsupported" ? "unsupported" : "denied");
      setCoords(null);
    }
  };

  const retryLocation = async () => {
    setGeoStatus("capturing");
    try {
      const location = await captureLocation();
      setCoords(location);
      setGeoStatus("done");
    } catch (err) {
      const message = (err as Error).message;
      setGeoStatus(message === "unsupported" ? "unsupported" : "denied");
    }
  };

  const canSubmit =
    !!areaQuery.data && shopName.trim().length > 0 && ownerContact.trim().length >= 6 && !!photoFile;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!areaQuery.data || !photoFile) return;

    registerShop.mutate({
      areaCode: areaQuery.data.areaCode,
      shopName: shopName.trim(),
      ownerContact: ownerContact.trim(),
      photoFile,
      latitude: coords?.latitude ?? null,
      longitude: coords?.longitude ?? null,
    });
  };

  const resetForm = () => {
    setShopName("");
    setOwnerContact("");
    setPhotoFile(null);
    setPhotoPreviewUrl(null);
    setGeoStatus("idle");
    setCoords(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    registerShop.reset();
  };

  if (!areaCode) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.blockedState}>
            <QrCode size={32} className={styles.blockedIcon} />
            <h1 className={styles.title}>Scan a QR stand to begin</h1>
            <p className={styles.subtitle}>
              Open this page by scanning the QR sticker on the back of a stand -- the area it
              belongs to is read from the code, so there's nothing to pick manually.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (registerShop.isSuccess) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.blockedState}>
            <CheckCircle2 size={32} className={styles.successIconLarge} />
            <h1 className={styles.title}>Shop registered</h1>
            <p className={styles.subtitle}>
              {registerShop.data.shopName} is now linked to {registerShop.data.subLocalityName},{" "}
              {registerShop.data.localityName}.
            </p>
            <Button onClick={resetForm}>Register another shop</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.iconBadge}>
            <QrCode size={20} />
          </div>
          <div>
            <h1 className={styles.title}>Register this QR stand</h1>
            <p className={styles.subtitle}>Fill this in on-site when placing a new shop QR stand.</p>
          </div>
        </div>

        <div className={styles.areaBlock}>
          {areaQuery.isFetching ? (
            <Skeleton className={styles.areaSkeleton} />
          ) : areaQuery.isError ? (
            <div className={styles.errorBanner} role="alert">
              <TriangleAlert size={16} />
              <span>{(areaQuery.error as Error)?.message ?? "Couldn't look up this QR code."}</span>
            </div>
          ) : areaQuery.data ? (
            <div className={styles.areaResolved}>
              <span className={styles.areaLabel}>Area (from QR code)</span>
              <span className={styles.areaValue}>
                {areaQuery.data.subLocalityName}, {areaQuery.data.localityName}
              </span>
              <span className={styles.areaCode}>{areaQuery.data.areaCode}</span>
            </div>
          ) : null}
        </div>

        {registerShop.isError ? (
          <div className={styles.errorBanner} role="alert">
            <TriangleAlert size={16} />
            <span>{(registerShop.error as Error)?.message ?? "Could not register this shop. Try again."}</span>
          </div>
        ) : null}

        <form onSubmit={onSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="shopName">
              Shop name
            </label>
            <Input
              id="shopName"
              placeholder="e.g. Sharma General Store"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="ownerContact">
              Owner phone number
            </label>
            <Input
              id="ownerContact"
              type="tel"
              placeholder="10-digit mobile number"
              value={ownerContact}
              onChange={(e) => setOwnerContact(e.target.value)}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Shop photo (geotagged)</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={onPhotoSelected}
              className={styles.hiddenFileInput}
              id="shopPhoto"
            />
            {photoPreviewUrl ? (
              <div className={styles.photoPreviewWrap}>
                <img src={photoPreviewUrl} alt="Captured shop" className={styles.photoPreview} />
                <label htmlFor="shopPhoto" className={styles.retakeLabel}>
                  Retake
                </label>
              </div>
            ) : (
              <label htmlFor="shopPhoto" className={styles.photoCaptureButton}>
                <Camera size={18} />
                Take shop photo
              </label>
            )}

            <div className={styles.geoStatus}>
              {geoStatus === "capturing" && <span className={styles.geoPending}>Capturing location...</span>}
              {geoStatus === "done" && coords && (
                <span className={styles.geoDone}>
                  <MapPin size={14} /> Location captured ({coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)})
                </span>
              )}
              {(geoStatus === "denied" || geoStatus === "unsupported") && (
                <div className={styles.geoWarning}>
                  <TriangleAlert size={14} />
                  <span>
                    {geoStatus === "denied"
                      ? "Location permission was denied -- the shop will be saved without exact coordinates."
                      : "Location isn't available on this device -- the shop will be saved without exact coordinates."}
                  </span>
                  {geoStatus === "denied" && (
                    <button type="button" onClick={retryLocation} className={styles.retryLink}>
                      Retry
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          <Button type="submit" disabled={!canSubmit || registerShop.isPending} className={styles.submitButton}>
            {registerShop.isPending ? "Registering..." : "Register shop"}
          </Button>
        </form>
      </div>
    </div>
  );
}