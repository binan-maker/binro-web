import { Container } from "@/components/ui/Container";
import { ButtonLink } from "@/components/ui/Button";
import { ArrowRightIcon } from "@/components/ui/Icons";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-[#D4DDE2] bg-white py-16 sm:py-24 lg:py-28">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-full bg-[radial-gradient(circle_at_82%_24%,rgba(212,221,226,0.42),transparent_52%)]"
      />
      <Container className="relative">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-7">
            <p className="text-sm font-medium text-[#5C7E8F]">
              BinRo · Human-centred technology company
            </p>
            <h1 className="mt-4 text-[clamp(2.25rem,4.2vw,3.75rem)] font-semibold leading-[1.1] tracking-tight text-[#20272B] text-balance">
              Technology for everyday life.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-[#4A555C] sm:text-lg sm:leading-relaxed">
              We build useful digital products, business software, developer
              tools and intelligent systems to make technology more accessible,
              understandable and useful.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <ButtonLink href="#divisions" variant="primary" size="lg">
                <span>Explore our divisions</span>
                <ArrowRightIcon className="h-4 w-4" />
              </ButtonLink>
              <ButtonLink href="/about" variant="secondary" size="lg">
                Discover BinRo
              </ButtonLink>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div
              aria-hidden="true"
              className="relative mx-auto aspect-[4/3] w-full max-w-[460px] rounded-2xl border border-[#D4DDE2] bg-[#F3F6F7] p-6 sm:p-8"
            >
              {/* Subtle architectural grid lines */}
              <svg
                viewBox="0 0 400 300"
                className="h-full w-full"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <pattern
                    id="frost-grid"
                    width="32"
                    height="32"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 32 0 L 0 0 0 32"
                      fill="none"
                      stroke="#D4DDE2"
                      strokeWidth="0.75"
                    />
                  </pattern>
                </defs>
                <rect width="400" height="300" rx="12" fill="url(#frost-grid)" />

                {/* Four unified architectural planes representing the four divisions */}
                <rect
                  x="28"
                  y="32"
                  width="156"
                  height="104"
                  rx="10"
                  fill="#FFFFFF"
                  stroke="#D4DDE2"
                  strokeWidth="1.25"
                />
                <rect
                  x="44"
                  y="50"
                  width="48"
                  height="6"
                  rx="3"
                  fill="#5C7E8F"
                />
                <rect
                  x="44"
                  y="66"
                  width="110"
                  height="4"
                  rx="2"
                  fill="#D4DDE2"
                />
                <rect
                  x="44"
                  y="78"
                  width="84"
                  height="4"
                  rx="2"
                  fill="#E4EBEF"
                />

                <rect
                  x="216"
                  y="32"
                  width="156"
                  height="104"
                  rx="10"
                  fill="#5C7E8F"
                />
                <rect
                  x="232"
                  y="50"
                  width="54"
                  height="6"
                  rx="3"
                  fill="#FFFFFF"
                />
                <rect
                  x="232"
                  y="66"
                  width="112"
                  height="4"
                  rx="2"
                  fill="#D4DDE2"
                  fillOpacity="0.7"
                />
                <rect
                  x="232"
                  y="78"
                  width="88"
                  height="4"
                  rx="2"
                  fill="#D4DDE2"
                  fillOpacity="0.45"
                />

                <rect
                  x="28"
                  y="164"
                  width="156"
                  height="104"
                  rx="10"
                  fill="#D4DDE2"
                  fillOpacity="0.55"
                  stroke="#C4D0D7"
                  strokeWidth="1.25"
                />
                <rect
                  x="44"
                  y="182"
                  width="52"
                  height="6"
                  rx="3"
                  fill="#426579"
                />
                <rect
                  x="44"
                  y="198"
                  width="104"
                  height="4"
                  rx="2"
                  fill="#A2A2A2"
                  fillOpacity="0.55"
                />
                <rect
                  x="44"
                  y="210"
                  width="76"
                  height="4"
                  rx="2"
                  fill="#A2A2A2"
                  fillOpacity="0.4"
                />

                <rect
                  x="216"
                  y="164"
                  width="156"
                  height="104"
                  rx="10"
                  fill="#FFFFFF"
                  stroke="#5C7E8F"
                  strokeOpacity="0.45"
                  strokeWidth="1.25"
                />
                <rect
                  x="232"
                  y="182"
                  width="58"
                  height="6"
                  rx="3"
                  fill="#20272B"
                  fillOpacity="0.8"
                />
                <rect
                  x="232"
                  y="198"
                  width="108"
                  height="4"
                  rx="2"
                  fill="#D4DDE2"
                />
                <rect
                  x="232"
                  y="210"
                  width="82"
                  height="4"
                  rx="2"
                  fill="#E4EBEF"
                />

                {/* Subtle central connective lines uniting the four divisions */}
                <path
                  d="M184 84H216M184 216H216M106 136V164M294 136V164"
                  stroke="#5C7E8F"
                  strokeOpacity="0.5"
                  strokeWidth="1.25"
                />
                <circle cx="200" cy="150" r="18" fill="#FFFFFF" fillOpacity="0.82" stroke="#5C7E8F" strokeWidth="1.25" />
                <circle cx="200" cy="150" r="5" fill="#426579" />
              </svg>

              {/* Restrained frosted glass layer */}
              <div className="pointer-events-none absolute inset-x-8 bottom-4 rounded-xl border border-white/80 bg-white/75 px-4 py-2.5 backdrop-blur-md">
                <div className="flex items-center justify-between text-xs font-medium text-[#20272B]">
                  <span>One company</span>
                  <span className="text-[#5C7E8F]">Four divisions</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
