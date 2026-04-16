import { ThanksBody } from "./thanks-body";
import { ThanksClearCart } from "./thanks-clear-cart";

export default async function ThanksPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; id?: string }>;
}) {
  const { ref, id } = await searchParams;

  return (
    <div className="mx-auto max-w-lg px-4 py-12 pb-[max(3rem,env(safe-area-inset-bottom))] sm:py-24 sm:pb-24">
      <ThanksClearCart />
      <ThanksBody reference={ref} orderId={id} />
    </div>
  );
}
