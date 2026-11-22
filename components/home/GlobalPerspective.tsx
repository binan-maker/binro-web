import { Container } from "@/components/ui/Container";

export function GlobalPerspective() {
  return (
    <section className="border-t border-[#D4DDE2] bg-white py-20 sm:py-24">
      <Container>
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
          <div className="lg:col-span-6">
            <p className="text-sm font-medium text-[#5C7E8F]">
              India to the world
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[#20272B] sm:text-3xl lg:text-[2.125rem] lg:leading-[1.2] text-balance">
              Built with a global perspective. Starting from India.
            </h2>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-[#4A555C] sm:text-[1.0625rem]">
              BinRo begins its journey in India, with a long-term ambition to
              serve individuals, businesses and developers around the world.
            </p>
          </div>

          <div className="lg:col-span-6">
            <div
              aria-hidden="true"
              className="mx-auto max-w-[480px] rounded-2xl border border-[#D4DDE2] bg-[#F3F6F7] p-6 sm:p-8"
            >
              <svg
                viewBox="0 0 420 220"
                className="w-full h-auto"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Concentric meridians radiating calmly from origin */}
                <circle
                  cx="132"
                  cy="128"
                  r="42"
                  stroke="#D4DDE2"
                  strokeWidth="1.25"
                />
                <circle
                  cx="132"
                  cy="128"
                  r="86"
                  stroke="#D4DDE2"
                  strokeWidth="1.25"
                />
                <circle
                  cx="132"
                  cy="128"
                  r="134"
                  stroke="#D4DDE2"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <circle
                  cx="132"
                  cy="128"
                  r="190"
                  stroke="#D4DDE2"
                  strokeWidth="1"
                  strokeDasharray="3 6"
                />
                <path
                  d="M24 128H396"
                  stroke="#D4DDE2"
                  strokeWidth="1"
                />
                <path
                  d="M132 16V208"
                  stroke="#D4DDE2"
                  strokeWidth="1"
                />

                {/* Horizon expansion curves */}
                <path
                  d="M132 128C188 92 256 76 348 76"
                  stroke="#5C7E8F"
                  strokeWidth="1.5"
                />
                <path
                  d="M132 128C198 118 272 124 374 148"
                  stroke="#5C7E8F"
                  strokeOpacity="0.65"
                  strokeWidth="1.25"
                />

                {/* Origin point */}
                <circle
                  cx="132"
                  cy="128"
                  r="12"
                  fill="#FFFFFF"
                  stroke="#5C7E8F"
                  strokeWidth="1.5"
                />
                <circle cx="132" cy="128" r="5" fill="#426579" />

                {/* Horizon markers */}
                <circle cx="348" cy="76" r="4" fill="#5C7E8F" />
                <circle cx="374" cy="148" r="3.5" fill="#A2A2A2" />
              </svg>
              <div className="mt-4 flex items-center justify-between border-t border-[#D4DDE2] pt-3 text-xs text-[#4A555C]">
                <span>Starting in India</span>
                <span>Long-term global outlook</span>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
