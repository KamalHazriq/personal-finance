"use client";

import * as React from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

function Sheet({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root {...props} />;
}

function SheetTrigger({
  className,
  ...props
}: DialogPrimitive.Trigger.Props & { className?: string }) {
  return <DialogPrimitive.Trigger className={className} {...props} />;
}

function SheetClose({
  className,
  ...props
}: DialogPrimitive.Close.Props & { className?: string }) {
  return <DialogPrimitive.Close className={className} {...props} />;
}

function SheetPortal({ ...props }: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal {...props} />;
}

function SheetBackdrop({
  className,
  ...props
}: DialogPrimitive.Backdrop.Props & { className?: string }) {
  return (
    <DialogPrimitive.Backdrop
      className={cn(
        "fixed inset-0 z-50 bg-black/80 data-[starting-style]:opacity-0 data-[ending-style]:opacity-0 transition-opacity duration-300",
        className
      )}
      {...props}
    />
  );
}

type SheetContentProps = DialogPrimitive.Popup.Props & {
  side?: "left" | "right" | "top" | "bottom";
  className?: string;
};

function SheetContent({
  className,
  children,
  side = "right",
  ...props
}: SheetContentProps) {
  const sideStyles = {
    left: "inset-y-0 left-0 h-full w-3/4 max-w-sm border-r data-[starting-style]:-translate-x-full data-[ending-style]:-translate-x-full",
    right:
      "inset-y-0 right-0 h-full w-3/4 max-w-sm border-l data-[starting-style]:translate-x-full data-[ending-style]:translate-x-full",
    top: "inset-x-0 top-0 w-full border-b data-[starting-style]:-translate-y-full data-[ending-style]:-translate-y-full",
    bottom:
      "inset-x-0 bottom-0 w-full border-t data-[starting-style]:translate-y-full data-[ending-style]:translate-y-full",
  };

  return (
    <SheetPortal>
      <SheetBackdrop />
      <DialogPrimitive.Popup
        className={cn(
          "fixed z-50 flex flex-col gap-4 bg-background p-6 shadow-lg transition-transform duration-300 ease-in-out",
          sideStyles[side],
          className
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
          <X className="size-4" />
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      </DialogPrimitive.Popup>
    </SheetPortal>
  );
}

function SheetHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  );
}

function SheetTitle({
  className,
  ...props
}: DialogPrimitive.Title.Props & { className?: string }) {
  return (
    <DialogPrimitive.Title
      className={cn("text-lg font-semibold text-foreground", className)}
      {...props}
    />
  );
}

function SheetDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props & { className?: string }) {
  return (
    <DialogPrimitive.Description
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetPortal,
  SheetBackdrop,
};
