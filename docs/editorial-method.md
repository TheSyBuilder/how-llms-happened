# Editorial method

LLM Lineage is a history of research ideas, not a ranking of papers. Its corpus must explain how modern large language models became possible while preserving alternate branches, constraints, failed assumptions, and uncertain relationships.

This document is the public research contract for deciding what enters the atlas and how claims are represented.

## Unit of evidence

The atlas separates five things that are often collapsed in a conventional timeline:

1. **Work** — a paper, technical report, dataset, implementation, or other citable research artifact.
2. **Idea** — a mechanism, objective, empirical finding, problem formulation, or constraint.
3. **Claim** — a specific statement supported by a source and an exact location within it.
4. **Relationship** — a typed connection between works or ideas, with its own evidence and confidence.
5. **Learning experience** — beginner and expert treatments built from the same claims, not independent retellings.

A publication date alone never establishes a relationship.

## Inclusion test

A core work should satisfy most of the following questions:

- Did it introduce, combine, test, clarify, or make practical an idea needed to explain later language models?
- Is its role supported by primary evidence rather than retrospective fame alone?
- Would removing it leave an important capability, objective, architecture, scaling constraint, or research branch unexplained?
- Can its contribution and limitations be stated precisely?
- Does it add something not already represented by a stronger or earlier source?

Citation count, product popularity, author prominence, and current fashion are not sufficient reasons for inclusion.

Each candidate receives one editorial status:

- **Core** — necessary to understand the main technical lineage.
- **Branch** — necessary to understand an important alternate or converging line.
- **Prologue** — conceptually important before the main boundary, without implying a continuous causal chain.
- **Context** — useful background that does not need a full paper experience.
- **Candidate** — plausible, but still missing evidence or comparative review.
- **Excluded** — reviewed and omitted with a recorded rationale.

## Source hierarchy

Use the strongest available source for each claim:

1. Original paper or technical report.
2. Official publisher record, author page, project page, dataset card, or implementation.
3. Author talk, interview, or retrospective for intent and historical context.
4. High-quality scholarly synthesis for broader interpretation or disputed history.
5. General secondary explanation only for orientation or interaction-design inspiration.

Secondary sources do not replace a primary source for a paper’s method, result, or stated limitation. Every source record includes its URL, access date, supported claim, evidence location, and any access or version caveat.

## Claim discipline

Every factual claim promoted into the product must identify:

- the source;
- the relevant section, page, figure, table, or quoted fragment location;
- whether the source directly states the claim or the editors infer it;
- confidence and material uncertainty;
- the date on which an unstable claim was last checked.

Verbatim excerpts remain short and are used only when wording itself matters. Results retain the paper’s conditions: task, dataset, baseline, metric, model scale, and version where relevant.

Unqualified words such as “first,” “invented,” “solved,” and “proved” require an operational definition and a documented prior-art search. Otherwise the atlas uses narrower language such as “introduced in this setting,” “demonstrated at this scale,” or “made practical under these conditions.”

## Relationship evidence

Relationships use two separate labels: what kind of connection is proposed, and how strongly history supports it.

### Connection types

- **Builds on** — directly adopts a named predecessor’s method or result.
- **Extends** — preserves a mechanism while expanding its scope or capability.
- **Combines** — joins previously separate ideas.
- **Challenges** — supplies evidence or an argument against an earlier assumption.
- **Makes practical** — removes a documented obstacle to use or scale.
- **Enables** — provides a necessary mechanism later reused elsewhere.
- **Conceptual parallel** — helps explain an idea but has no demonstrated causal path.

### Evidence classes

- **Documented influence** — the later work cites, discusses, or is explicitly connected to the earlier work by a primary participant.
- **Inherited mechanism** — primary sources show the same mechanism passing between works, but the historical influence is not directly stated.
- **Editorial synthesis** — a useful historiographic interpretation or conceptual affinity.

Only documented influence may be rendered as an unqualified causal lineage edge. Inherited mechanisms and editorial synthesis must remain visually and textually distinct. Each edge is independently removable; deleting a weak relationship must not require deleting its nodes.

## Dates and versions

The corpus records submission, public preprint, conference, and journal dates separately when they differ. The interface must state which date controls ordering. Materially different versions receive version notes rather than silently sharing claims.

## Uncertainty and disagreement

Uncertainty is product content, not an internal defect. The atlas records:

- disputed priority;
- missing or inaccessible primary evidence;
- ambiguous influence;
- results that failed to reproduce or depended on narrow conditions;
- editorial alternatives and what evidence would change the decision.

Confidence belongs to individual claims and relationships, not just whole papers.

## One corpus, two learning modes

Beginner and expert modes share claim IDs, sources, and relationship evidence. They differ in instructional design.

The beginner mode must provide prerequisites, plain-language models, limited notation, guided ordering, and interactions that isolate one causal idea at a time. It must not gain clarity by introducing false mechanisms.

The expert mode must expose objectives, assumptions, equations, experimental conditions, ablations, limitations, implementation context, and source-level inspection. It must not become a citation dump or merely reveal hidden paragraphs.

Both modes must make uncertainty visible at an appropriate level and converge on the same factual account.

## Interaction gate

No interaction enters implementation without a written brief that states its learning objective, why static explanation is insufficient, user action, visual response, beginner and expert variants, represented claim, inspirations, accessibility behavior, likely misconceptions, performance constraints, and observable acceptance criteria.

An interaction is rejected when motion or manipulation does not teach a cause-and-effect relationship more clearly than prose or a static figure.

## Publication gate

A corpus slice is ready for public implementation only when:

- every core claim has primary evidence;
- each relationship has a type, evidence class, confidence, and rationale;
- important limitations and plausible counter-interpretations are present;
- dates and versions are unambiguous;
- beginner and expert learning objectives are written;
- proposed interactions pass the interaction gate;
- factual review finds no unsupported priority or causality claims.

Changes to a settled slice require new evidence, a correction, or a clearly recorded editorial reason.
