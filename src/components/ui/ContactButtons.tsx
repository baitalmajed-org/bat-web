import { Phone } from "lucide-react";
import WhatsAppIcon from "@/components/ui/WhatsAppIcon";
import { telHref, whatsappHref } from "@/lib/config/site";

type Props = {
  phone: string;
  whatsapp: string;
  waMessage?: string;
  tone?: "dark" | "light";
  waLabel?: string;
  callLabel?: string;
};

export default function ContactButtons({ phone, whatsapp, waMessage, tone = "light", waLabel = "Enquire on WhatsApp", callLabel = "Call Now" }: Props) {
  return (
    <div className="flex flex-wrap gap-3">
      <a href={whatsappHref(whatsapp, waMessage)} target="_blank" rel="noopener noreferrer" className="btn-primary">
        <WhatsAppIcon className="h-4 w-4" /> {waLabel}
      </a>
      <a href={telHref(phone)} className={tone === "light" ? "btn-light" : "btn-outline"}>
        <Phone className="h-4 w-4" aria-hidden /> {callLabel}
      </a>
    </div>
  );
}
