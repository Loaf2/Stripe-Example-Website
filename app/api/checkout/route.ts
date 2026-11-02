import Stripe from "stripe";

export async function POST(request: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    return Response.json(
      {
        error:
          "Stripe checkout is not configured. Set STRIPE_SECRET_KEY.",
      },
      { status: 500 },
    );
  }

  const stripe = new Stripe(secretKey);
  const origin = new URL(request.url).origin;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "eur",
            unit_amount: 50_000,
            product_data: { name: "random item" },
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/?checkout=success`,
      cancel_url: `${origin}/?checkout=cancelled`,
    });

    if (!session.url) {
      return Response.json(
        { error: "Stripe did not return a checkout URL." },
        { status: 502 },
      );
    }

    return Response.json({ url: session.url });
  } catch (error) {
    if (!(error instanceof Stripe.errors.StripeError)) {
      throw error;
    }

    console.error("Stripe Checkout session creation failed:", error);
    return Response.json(
      { error: "Unable to create a Stripe Checkout session. Please try again." },
      { status: 502 },
    );
  }
}
