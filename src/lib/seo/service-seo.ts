/**
 * Targeted B2B SEO metadata, detailed capabilities, UAE market info, and FAQs
 * for Bait Al Majed Metal Works services.
 */

export interface ServiceSeoData {
  title: string;
  metaDescription: string;
  h1: string;
  shortDescription: string;
  overview: string;
  capabilities: string[];
  uaeMarketCoverage: string;
  faqs: { question: string; answer: string }[];
  relatedProductCategorySlug: string;
  relatedProductCategoryName: string;
}

export const SERVICE_SEO_DATA: Record<string, ServiceSeoData> = {
  "steel-fabrication": {
    title: "Steel Fabrication Company in UAE | Custom Steel Workshop Ajman",
    metaDescription:
      "Premier steel fabrication company based in Ajman, UAE. In-house cutting, bending, welding, and custom steel structures for industrial and commercial projects.",
    h1: "Industrial Steel Fabrication & Custom Metal Works in Ajman, UAE",
    shortDescription:
      "Comprehensive structural and industrial steel fabrication, precision cutting, bending, welding, and custom assembly at our Ajman facility.",
    overview:
      "Bait Al Majed Metal Works is a steel fabrication company headquartered in Al Jurf Industrial Area, Ajman, United Arab Emirates. We deliver metal fabrication, structural components, and custom steel assemblies for contractors, workshops, and industrial clients throughout the UAE. Our equipped workshop houses steel cutting, profile bending, shearing, and welding capabilities.",
    capabilities: [
      "Heavy & Medium Structural Steel Fabrication",
      "Precision Steel Plate Cutting, Shearing & Bending",
      "Structural Steel & Metal Arc Welding",
      "Custom Steel Frames, Skids, Brackets & Enclosures",
      "Steel Ladders, Platforms, Walkways & Handrails",
      "Protective Industrial Primer & Paint Finishes",
    ],
    uaeMarketCoverage:
      "Fabrication services delivered to project sites across Ajman, Dubai (Al Quoz, Jebel Ali, Ras Al Khor), Sharjah (Al Sajaa, Industrial Areas), Abu Dhabi (Mussafah, ICAD), and Northern Emirates.",
    faqs: [
      {
        question: "What types of steel fabrication projects does Bait Al Majed handle?",
        answer:
          "We handle structural and miscellaneous steel fabrication, including industrial equipment frames, construction lifting equipment, access ladders, handrails, skids, storage racks, and custom architectural metalworks.",
      },
      {
        question: "Can you fabricate from client-provided engineering drawings or CAD files?",
        answer:
          "Yes, we fabricate from architectural drawings, structural CAD files, or physical sample components provided by contractors and procurement teams.",
      },
      {
        question: "How do contractors request a quotation for steel fabrication?",
        answer:
          "You can share your project drawings, required quantities, and specifications via WhatsApp or our online inquiry form. Our estimation team will review and respond with a quotation.",
      },
    ],
    relatedProductCategorySlug: "custom-fabrication",
    relatedProductCategoryName: "Custom Steel Products",
  },

  "customized-steel-products": {
    title: "Custom Steel Products Manufacturer UAE | Made-to-Order Metal Fabrication Ajman",
    metaDescription:
      "Custom steel products and bespoke metal fabrication manufactured to exact engineering drawings in Ajman, UAE. Fast quotation turnaround for contractors.",
    h1: "Custom Steel Products & Bespoke Metal Fabrication in UAE",
    shortDescription:
      "Tailor-made industrial metal products, bespoke equipment, and customized steel fabrications built to exact contractor specifications in Ajman, UAE.",
    overview:
      "Every industrial project possesses unique technical requirements that standard off-the-shelf items cannot fulfill. Bait Al Majed Metal Works specializes in custom steel products fabricated to order at our Ajman facility. Whether you require bespoke material handling fixtures, machinery guards, customized hoppers, or specialized structural frames, our craftsmen work with precision and high-grade steel.",
    capabilities: [
      "Custom Machinery Bases, Skids & Support Frames",
      "Bespoke Storage Racks, Cantilevers & Steel Shelving",
      "Steel Formwork Boxes, Concrete Molds & Spreader Beams",
      "Custom Industrial Hoppers, Chutes & Transitions",
      "Metal Security Enclosures, Window Guards & Gates",
    ],
    uaeMarketCoverage:
      "Custom metal fabrications built in Ajman and shipped directly to commercial and industrial sites across the UAE.",
    faqs: [
      {
        question: "What information is needed to request a quotation for custom steel products?",
        answer:
          "Please provide drawings, sketches, or dimensions along with desired steel thickness, material grade, quantity, and finishing specifications (e.g., painted, galvanized, or primer coated).",
      },
      {
        question: "Do you fabricate single prototypes or production runs?",
        answer:
          "We cater to single custom units, prototype development, and large batch production runs for commercial fit-outs and infrastructure projects.",
      },
    ],
    relatedProductCategorySlug: "custom-fabrication",
    relatedProductCategoryName: "Custom Steel Products",
  },

  "construction-equipment": {
    title: "Construction Equipment Manufacturer UAE | Site Material Handling Equipment Ajman",
    metaDescription:
      "Manufacturing heavy-duty construction equipment in Ajman, UAE: wheelbarrows, lifting cages, concrete buckets, and site safety metal products.",
    h1: "Construction Equipment & Site Material Handling Manufacturer UAE",
    shortDescription:
      "Heavy-duty construction equipment fabricated in Ajman, UAE: welded wheelbarrows, crane material lifting cages, concrete buckets, and masonry tools.",
    overview:
      "Demanding construction environments across the UAE require heavy-duty site equipment that won't fail during critical operations. Bait Al Majed Metal Works manufactures robust steel construction equipment engineered for safety, durability, and high productivity. Our factory in Ajman produces welded wheelbarrows, crane lifting cages, concrete skips, and mortar tubs for building contractors throughout the Emirates.",
    capabilities: [
      "Heavy-Duty Welded Wheelbarrows (Single & Double Tyre)",
      "Crane-Certified Material Lifting Cages & Baskets",
      "Crane Concrete Pouring Buckets with Lever Gates",
      "Masonry & Block Handling Carts and Wheelbarrows",
      "Site Tool Storage Boxes & Heavy-Duty Gang Boxes",
    ],
    uaeMarketCoverage:
      "Direct contractor and distributor supply throughout Ajman, Dubai, Sharjah, Abu Dhabi, and Northern Emirates.",
    faqs: [
      {
        question: "Are your construction equipment products readily available in stock?",
        answer:
          "We maintain active inventory of standard wheelbarrows, cylinder trolleys, and popular concrete buckets at our Ajman facility, and can rapidly manufacture bulk orders upon request.",
      },
      {
        question: "Do you offer wholesale pricing for equipment rental companies and dealers?",
        answer:
          "Yes, we provide tiered commercial wholesale pricing for tool hire companies, construction equipment rental agencies, and building material suppliers.",
      },
    ],
    relatedProductCategorySlug: "wheelbarrows",
    relatedProductCategoryName: "Construction Wheelbarrows",
  },

  "material-handling-equipment": {
    title: "Material Handling Equipment Manufacturer UAE | Trolleys & Steel Carts Ajman",
    metaDescription:
      "Industrial material handling equipment supplier in UAE. Heavy-duty gas trolleys, platform carts, and warehouse transport equipment fabricated in Ajman.",
    h1: "Industrial Material Handling Equipment Manufacturer in UAE",
    shortDescription:
      "Industrial material handling equipment, gas cylinder trolleys, warehouse platform carts, and heavy-duty steel transport trolleys made in Ajman, UAE.",
    overview:
      "Safe, efficient movement of heavy materials improves productivity and reduces workplace injuries. Bait Al Majed Metal Works manufactures heavy-duty material handling equipment tailored for warehouses, workshops, shipping yards, and construction facilities across the UAE.",
    capabilities: [
      "Oxygen, Acetylene & LPG Gas Cylinder Trolleys",
      "Heavy-Duty Flatbed Steel Platform Trolleys",
      "Pallet Hand Carts & Industrial Drum Handling Carts",
      "Workshop Mobile Tool & Parts Carts",
      "Heavy-Duty Swivel & Brake Caster Assembly",
    ],
    uaeMarketCoverage:
      "Delivered to industrial clusters across Ajman, Dubai, Sharjah, and Abu Dhabi.",
    faqs: [
      {
        question: "Can platform trolleys be fitted with pneumatic wheels for outdoor use?",
        answer:
          "Yes, we can equip handling trolleys with solid rubber, polyurethane, or large pneumatic wheels designed specifically for rough gravel or outdoor terrain.",
      },
    ],
    relatedProductCategorySlug: "gas-trolleys",
    relatedProductCategoryName: "Gas Trolleys",
  },

  "industrial-safety-equipment": {
    title: "Industrial Safety Metal Equipment Manufacturer UAE | Site Protection Ajman",
    metaDescription:
      "Fabrication of steel safety equipment, machinery guards, barrier gates, handrails, and cylinder retention systems in Ajman, UAE.",
    h1: "Industrial Safety Metal Works & Protection Equipment UAE",
    shortDescription:
      "Fabricating industrial steel safety equipment, machinery guards, warehouse barrier posts, edge protection, and safety barriers in Ajman, UAE.",
    overview:
      "Workplace safety compliance is critical across UAE industrial facilities. Bait Al Majed Metal Works fabricates structural steel safety barriers, safety bollards, machinery guards, handrail systems, and cylinder safety stands in Ajman to protect personnel and valuable infrastructure.",
    capabilities: [
      "Steel Safety Bollards & Warehouse Column Guards",
      "Industrial Machinery & Belt Conveyor Mesh Guards",
      "Temporary & Permanent Edge Protection Handrails",
      "Gas Cylinder Storage Cages & Retention Stands",
      "Self-Closing Safety Gates & Access Ladders",
    ],
    uaeMarketCoverage:
      "Supplied and installed across industrial zones and construction developments in the UAE.",
    faqs: [
      {
        question: "Do you fabricate custom machinery guards to safety specs?",
        answer:
          "Yes, we fabricate custom wire mesh and sheet metal safety guards tailored to the exact dimensions of your industrial machinery and conveyors.",
      },
    ],
    relatedProductCategorySlug: "custom-fabrication",
    relatedProductCategoryName: "Custom Fabrication",
  },

  "structural-architectural-metal-works": {
    title: "Structural & Architectural Metal Works UAE | Steel Fabrication Ajman",
    metaDescription:
      "Structural steel fabrication, mezzanine frames, architectural metalworks, steel stairs, gates, and car parking sheds in Ajman, UAE.",
    h1: "Structural & Architectural Metal Works in UAE",
    shortDescription:
      "Structural steel fabrication, mezzanine floors, steel staircases, decorative architectural metal works, and car parking shades in Ajman, UAE.",
    overview:
      "From functional structural frameworks to aesthetic architectural metal features, Bait Al Majed Metal Works delivers high-standard steel craftsmanship in Ajman, UAE. We build mezzanine floor steel, industrial steel staircases, safety walkways, ornamental gates, and cantilevered car parking shades.",
    capabilities: [
      "Mezzanine Floor Steel Structures & Access Stairs",
      "Industrial & Commercial Steel Staircases & Spiral Stairs",
      "Heavy-Duty Sliding & Swing Steel Security Gates",
      "Car Parking Shed Cantilever Steel Frameworks",
      "Architectural Pergolas, Louvers & Metal Canopies",
    ],
    uaeMarketCoverage:
      "Supplied across commercial buildings, warehouses, villas, and industrial parks in the UAE.",
    faqs: [
      {
        question: "Can you provide site measurements and customized installation in UAE?",
        answer:
          "Yes, for structural and architectural metal works in Ajman, Sharjah, and Dubai, our fabrication team can coordinate site visits and precise measurements.",
      },
    ],
    relatedProductCategorySlug: "custom-fabrication",
    relatedProductCategoryName: "Custom Fabrication",
  },
};
