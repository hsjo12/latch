"use client";
import "react-toastify/dist/ReactToastify.css";
import { toast } from "react-toastify";
let isToastVisible = false;
const toastVisibility = new Set();
export function toastMessage(message, type, time = 2000) {
  const options = {
    position: "top-center",
    autoClose: time,
    onClose: () => {
      isToastVisible = false;
      toastVisibility.delete(`${type}-${message}`);
    },
  };

  const toastKey = `${type}-${message}`;
  if (type !== "dismiss" && toastVisibility.has(toastKey)) return;
  toastVisibility.add(toastKey);
  if (type === "success") {
    isToastVisible = true;
    return toast.success(message, options);
  } else if (type === "error") {
    toastVisibility.clear();
    toast.dismiss();
    isToastVisible = true;
    return toast.error(message, options);
  } else if (type === "info") {
    isToastVisible = true;
    return toast.info(message, options);
  } else if (type === "warn") {
    isToastVisible = true;
    return toast.warn(message, options);
  } else if (type === "dismiss") {
    isToastVisible = false;
    return toast.dismiss(message);
  } else {
    isToastVisible = true;
    toastVisibility.clear();
    return toast(message, options);
  }
}

export const connectMessage = async () => {
  return toastMessage("Please Connect Your Wallet", "warn");
};

export const txMessage = async (tx, message = "Transaction is sending...") => {
  const toastId = toastMessage(message, "info", 600000);
  try {
    await tx.wait().then(async (receipt) => {
      toast.dismiss(toastId);
      isToastVisible = false;
      toastVisibility.delete(`info-${message}`);
      if (receipt && receipt.status == 1) {
        setTimeout(
          () => toastMessage("Transaction is successful", "success"),
          0
        );
      } else {
        setTimeout(() => toastMessage("Transaction is failed", "error"), 0);
      }
    });
  } catch (error) {
    console.log(error);
  }
};

export const txApprove = async (tx) => {
  const toastId = toastMessage("Approving...", "info", 600000);
  await tx.wait().then(async (receipt) => {
    toast.dismiss(toastId);
    isToastVisible = false;
    toastVisibility.delete("info-Approving...");
    if (receipt && receipt.status == 1) {
      setTimeout(() => toastMessage("Transaction is successful", "success"), 0);
    } else {
      setTimeout(() => toastMessage("Transaction is failed", "error"), 0);
    }
  });
};
