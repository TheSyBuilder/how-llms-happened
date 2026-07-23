const priorityLanguage =
  /\b((?:the|a) first|first[- ](?:paper|study|model|method|system|use|demonstration)|earliest|invented|invention|originated|originator|pioneered|solved|proved|introduced|created|discovered|coined)\b/i;

const strongCausalLanguage =
  /\b(led (?:directly )?to|caused|inspired|motivated|built directly on|(?:directly )?enabled|resulted in|gave rise to|made (?:\S+\s+){0,3}possible)\b/i;

const prohibitedCausalLanguage = /\b(influenced|prompted|drove)\b/i;

const precisionRank = {
  year: 1,
  month: 2,
  day: 3,
};

function pointerValue(rootSchema, pointer) {
  if (!pointer.startsWith("#/")) {
    throw new Error(`Only local schema references are supported: ${pointer}`);
  }

  return pointer
    .slice(2)
    .split("/")
    .map((part) => part.replaceAll("~1", "/").replaceAll("~0", "~"))
    .reduce((value, part) => value?.[part], rootSchema);
}

function typeMatches(value, expected) {
  switch (expected) {
    case "array":
      return Array.isArray(value);
    case "integer":
      return Number.isInteger(value);
    case "null":
      return value === null;
    case "object":
      return value !== null && typeof value === "object" && !Array.isArray(value);
    default:
      return typeof value === expected;
  }
}

function canonicalJson(value) {
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  }

  if (value !== null && typeof value === "object") {
    const properties = Object.keys(value)
      .sort()
      .map(
        (key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`,
      );
    return `{${properties.join(",")}}`;
  }

  return JSON.stringify(value);
}

function sameJsonValue(left, right) {
  return canonicalJson(left) === canonicalJson(right);
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function validateJsonSchema(value, schema, rootSchema, path, errors) {
  if (!schema || typeof schema !== "object") {
    errors.push(`${path}: schema definition is missing`);
    return;
  }

  if (schema.$ref) {
    const referenced = pointerValue(rootSchema, schema.$ref);
    validateJsonSchema(value, referenced, rootSchema, path, errors);
    return;
  }

  if (schema.const !== undefined && !sameJsonValue(value, schema.const)) {
    errors.push(`${path}: must equal ${JSON.stringify(schema.const)}`);
  }

  if (schema.enum && !schema.enum.some((item) => sameJsonValue(value, item))) {
    errors.push(`${path}: must be one of ${schema.enum.join(", ")}`);
  }

  for (const branch of schema.allOf ?? []) {
    validateJsonSchema(value, branch, rootSchema, path, errors);
  }

  if (schema.if) {
    const conditionErrors = [];
    validateJsonSchema(value, schema.if, rootSchema, path, conditionErrors);
    const branch = conditionErrors.length === 0 ? schema.then : schema.else;
    if (branch) {
      validateJsonSchema(value, branch, rootSchema, path, errors);
    }
  }

  if (schema.oneOf) {
    const passingBranches = schema.oneOf.filter((branch) => {
      const branchErrors = [];
      validateJsonSchema(value, branch, rootSchema, path, branchErrors);
      return branchErrors.length === 0;
    });

    if (passingBranches.length !== 1) {
      errors.push(`${path}: must match exactly one allowed shape`);
    }
  }

  if (schema.anyOf) {
    const hasPassingBranch = schema.anyOf.some((branch) => {
      const branchErrors = [];
      validateJsonSchema(value, branch, rootSchema, path, branchErrors);
      return branchErrors.length === 0;
    });

    if (!hasPassingBranch) {
      errors.push(`${path}: must include a specific source locator`);
    }
  }

  if (schema.type && !typeMatches(value, schema.type)) {
    errors.push(`${path}: expected ${schema.type}`);
    return;
  }

  if (typeof value === "string") {
    if (schema.minLength !== undefined && value.length < schema.minLength) {
      errors.push(`${path}: must not be empty`);
    }

    if (schema.pattern && !new RegExp(schema.pattern, "u").test(value)) {
      errors.push(`${path}: does not match ${schema.pattern}`);
    }
  }

  if (typeof value === "number" && schema.minimum !== undefined && value < schema.minimum) {
    errors.push(`${path}: must be at least ${schema.minimum}`);
  }

  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) {
      errors.push(`${path}: must contain at least ${schema.minItems} item(s)`);
    }

    if (schema.uniqueItems) {
      const serialized = value.map((item) => canonicalJson(item));
      if (new Set(serialized).size !== serialized.length) {
        errors.push(`${path}: must not contain duplicate items`);
      }
    }

    if (schema.items) {
      value.forEach((item, index) => {
        validateJsonSchema(item, schema.items, rootSchema, `${path}[${index}]`, errors);
      });
    }

    if (schema.contains) {
      const hasMatch = value.some((item) => {
        const itemErrors = [];
        validateJsonSchema(item, schema.contains, rootSchema, path, itemErrors);
        return itemErrors.length === 0;
      });

      if (!hasMatch) {
        errors.push(`${path}: does not contain a required item`);
      }
    }
  }

  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    const properties = schema.properties ?? {};

    for (const requiredKey of schema.required ?? []) {
      if (!Object.hasOwn(value, requiredKey)) {
        errors.push(`${path}.${requiredKey}: is required`);
      }
    }

    for (const [key, item] of Object.entries(value)) {
      if (properties[key]) {
        validateJsonSchema(item, properties[key], rootSchema, `${path}.${key}`, errors);
      } else if (schema.additionalProperties === false) {
        errors.push(`${path}.${key}: is not an allowed field`);
      }
    }
  }
}

function mapById(records, label, errors) {
  const result = new Map();

  for (const [index, record] of (Array.isArray(records) ? records : []).entries()) {
    if (!record || typeof record.id !== "string") {
      continue;
    }

    if (result.has(record.id)) {
      errors.push(`${label}[${index}].id: duplicate id "${record.id}"`);
    } else {
      result.set(record.id, record);
    }
  }

  return result;
}

function isCalendarDate(value, precision, calendar = "gregorian") {
  const patterns = {
    year: /^\d{4}$/,
    month: /^\d{4}-(0[1-9]|1[0-2])$/,
    day: /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,
  };

  if (!patterns[precision]?.test(value)) {
    return false;
  }

  if (precision !== "day") {
    return true;
  }

  const [year, month, day] = value.split("-").map(Number);
  const gregorianLeap =
    year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const julianLeap = year % 4 === 0;
  const isLeap =
    calendar === "julian"
      ? julianLeap
      : calendar === "source-as-printed"
        ? gregorianLeap || julianLeap
        : gregorianLeap;
  const daysByMonth = [
    31,
    isLeap ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];
  return day <= daysByMonth[month - 1];
}

function checkDate(date, path, errors) {
  if (!date || typeof date.value !== "string" || typeof date.precision !== "string") {
    return;
  }

  if (!isCalendarDate(date.value, date.precision, date.calendar)) {
    errors.push(
      `${path}: "${date.value}" is not a valid ${date.precision}-precision date`,
    );
  }
}

function checkFullDate(value, path, errors) {
  if (
    typeof value === "string" &&
    !isCalendarDate(value, "day", "gregorian")
  ) {
    errors.push(`${path}: "${value}" is not a valid calendar date`);
  }
}

function checkNotAfter(value, maximum, path, errors) {
  if (
    typeof value === "string" &&
    typeof maximum === "string" &&
    isCalendarDate(value, "day", "gregorian") &&
    isCalendarDate(maximum, "day", "gregorian") &&
    value > maximum
  ) {
    errors.push(`${path}: "${value}" is later than corpus asOf "${maximum}"`);
  }
}

function checkHttpsUrl(value, path, errors) {
  if (typeof value !== "string") {
    return;
  }

  try {
    const parsed = new URL(value);
    if (
      parsed.protocol !== "https:" ||
      !parsed.hostname ||
      parsed.username ||
      parsed.password ||
      /\s/u.test(value)
    ) {
      errors.push(`${path}: must be a complete public HTTPS URL`);
    }
  } catch {
    errors.push(`${path}: must be a complete public HTTPS URL`);
  }
}

function checkReferences(ids, records, path, errors) {
  if (!Array.isArray(ids)) {
    return;
  }

  ids.forEach((id, index) => {
    if (!records.has(id)) {
      errors.push(`${path}[${index}]: unknown id "${id}"`);
    }
  });
}

function checkEvidence(
  evidence,
  path,
  sources,
  errors,
  { expectedWorkIds = [], requiredWorkIds = [] } = {},
) {
  if (!evidence || typeof evidence !== "object") {
    return;
  }

  const source = sources.get(evidence.sourceId);
  if (!source) {
    errors.push(`${path}.sourceId: unknown source "${evidence.sourceId}"`);
  } else if (!asArray(source.supports).includes("claim-location")) {
    errors.push(
      `${path}.sourceId: source "${evidence.sourceId}" is not marked for claim locations`,
    );
  } else {
    const relatedWorkIds = new Set(source.relatedWorkIds ?? []);
    if (
      expectedWorkIds.length > 0 &&
      !expectedWorkIds.some((workId) => relatedWorkIds.has(workId))
    ) {
      errors.push(
        `${path}.sourceId: source "${evidence.sourceId}" is unrelated to the evidenced work(s)`,
      );
    }

    if (
      requiredWorkIds.length > 0 &&
      !requiredWorkIds.some((workId) => relatedWorkIds.has(workId))
    ) {
      errors.push(
        `${path}.sourceId: documented influence must be evidenced by a source related to its target work(s)`,
      );
    }
  }

  const locator = evidence.locator;
  if (
    locator &&
    Number.isInteger(locator.pageEnd) &&
    !Number.isInteger(locator.pageStart)
  ) {
    errors.push(`${path}.locator.pageStart: is required when pageEnd is present`);
  }

  if (
    locator &&
    Number.isInteger(locator.pageStart) &&
    Number.isInteger(locator.pageEnd) &&
    locator.pageEnd < locator.pageStart
  ) {
    errors.push(`${path}.locator: pageEnd precedes pageStart`);
  }

  if (
    source?.pagination &&
    locator &&
    Number.isInteger(locator.pageStart) &&
    (locator.pageStart < source.pagination.pageStart ||
      locator.pageStart > source.pagination.pageEnd)
  ) {
    errors.push(
      `${path}.locator.pageStart: ${locator.pageStart} falls outside source pagination ${source.pagination.pageStart}–${source.pagination.pageEnd}`,
    );
  }

  if (
    source?.pagination &&
    locator &&
    Number.isInteger(locator.pageEnd) &&
    (locator.pageEnd < source.pagination.pageStart ||
      locator.pageEnd > source.pagination.pageEnd)
  ) {
    errors.push(
      `${path}.locator.pageEnd: ${locator.pageEnd} falls outside source pagination ${source.pagination.pageStart}–${source.pagination.pageEnd}`,
    );
  }
}

function checkNodeReference(reference, path, works, ideas, errors) {
  if (!reference || typeof reference !== "object") {
    return;
  }

  const records = reference.kind === "idea" ? ideas : works;
  if (!records.has(reference.id)) {
    errors.push(`${path}: unknown ${reference.kind} "${reference.id}"`);
  }
}

function toJulianDay(year, month, day, calendar) {
  const a = Math.floor((14 - month) / 12);
  const adjustedYear = year + 4800 - a;
  const adjustedMonth = month + 12 * a - 3;
  const shared =
    day +
    Math.floor((153 * adjustedMonth + 2) / 5) +
    365 * adjustedYear +
    Math.floor(adjustedYear / 4);

  return calendar === "julian"
    ? shared - 32083
    : shared -
        Math.floor(adjustedYear / 100) +
        Math.floor(adjustedYear / 400) -
        32045;
}

function orderingInterval(work) {
  const orderingEvent = asArray(work?.chronology?.events).find(
    (event) => event.id === work.chronology.orderingEventId,
  );
  const date = orderingEvent?.date;
  if (
    !date ||
    typeof date.value !== "string" ||
    !["year", "month", "day"].includes(date.precision)
  ) {
    return undefined;
  }

  const [year, suppliedMonth = 1, suppliedDay = 1] = date.value
    .split("-")
    .map(Number);
  const startMonth = date.precision === "year" ? 1 : suppliedMonth;
  const endMonth = date.precision === "year" ? 12 : suppliedMonth;
  const calendars =
    date.calendar === "source-as-printed"
      ? ["gregorian", "julian"]
      : [date.calendar];
  const boundaries = calendars.flatMap((calendar) => {
    const isLeap =
      calendar === "julian"
        ? year % 4 === 0
        : year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    const lastDays = [
      31,
      isLeap ? 29 : 28,
      31,
      30,
      31,
      30,
      31,
      31,
      30,
      31,
      30,
      31,
    ];
    const startDay = date.precision === "day" ? suppliedDay : 1;
    const endDay =
      date.precision === "day" ? suppliedDay : lastDays[endMonth - 1];

    return [
      toJulianDay(year, startMonth, startDay, calendar),
      toJulianDay(year, endMonth, endDay, calendar),
    ];
  });

  return {
    start: Math.min(...boundaries),
    end: Math.max(...boundaries),
  };
}

function checkPriorityText(value, path, errors) {
  if (typeof value === "string" && priorityLanguage.test(value)) {
    errors.push(
      `${path}: priority wording must live in a claim with a defined prior-art review`,
    );
  }
}

function semanticValidation(corpus, schema, errors) {
  if (!corpus || typeof corpus !== "object" || Array.isArray(corpus)) {
    return;
  }

  const works = mapById(corpus.works, "works", errors);
  const ideas = mapById(corpus.ideas, "ideas", errors);
  const sources = mapById(corpus.sources, "sources", errors);
  const claims = mapById(corpus.claims, "claims", errors);
  mapById(corpus.relationships, "relationships", errors);
  mapById(corpus.learningObjectives, "learningObjectives", errors);
  const versionOwners = new Map();

  for (const id of works.keys()) {
    if (ideas.has(id)) {
      errors.push(`works/ideas: node id "${id}" is used by both a work and an idea`);
    }
  }

  checkFullDate(corpus.asOf, "asOf", errors);

  for (const [workIndex, work] of asArray(corpus.works).entries()) {
    if (!work || typeof work !== "object" || Array.isArray(work)) {
      continue;
    }

    const path = `works[${workIndex}]`;
    const versionIds = new Set();
    const eventIds = new Set();

    for (const [versionIndex, version] of asArray(work.versions).entries()) {
      if (!version || typeof version !== "object" || Array.isArray(version)) {
        continue;
      }

      if (versionIds.has(version.id)) {
        errors.push(
          `${path}.versions[${versionIndex}].id: duplicate version id "${version.id}" within the work`,
        );
      }
      versionIds.add(version.id);

      const existingOwner = versionOwners.get(version.id);
      if (existingOwner && existingOwner !== work.id) {
        errors.push(
          `${path}.versions[${versionIndex}].id: version id "${version.id}" is already used by work "${existingOwner}"`,
        );
      } else {
        versionOwners.set(version.id, work.id);
      }
    }

    for (const [eventIndex, event] of asArray(
      work.chronology?.events,
    ).entries()) {
      if (!event || typeof event !== "object" || Array.isArray(event)) {
        continue;
      }

      if (eventIds.has(event.id)) {
        errors.push(
          `${path}.chronology.events[${eventIndex}].id: duplicate chronology event id "${event.id}" within the work`,
        );
      }
      eventIds.add(event.id);
    }

    if (!versionIds.has(work.canonicalVersionId)) {
      errors.push(
        `${path}.canonicalVersionId: unknown version "${work.canonicalVersionId}"`,
      );
    }

    if (!eventIds.has(work.chronology?.orderingEventId)) {
      errors.push(
        `${path}.chronology.orderingEventId: unknown chronology event "${work.chronology?.orderingEventId}"`,
      );
    }

    checkReferences(work.sourceIds, sources, `${path}.sourceIds`, errors);
    checkReferences(
      work.preferredSourceIds,
      sources,
      `${path}.preferredSourceIds`,
      errors,
    );
    checkReferences(work.ideaIds, ideas, `${path}.ideaIds`, errors);
    checkPriorityText(work.inclusion?.rationale, `${path}.inclusion.rationale`, errors);
    checkPriorityText(work.significance?.beginner, `${path}.significance.beginner`, errors);
    checkPriorityText(work.significance?.expert, `${path}.significance.expert`, errors);

    for (const [sourceIndex, sourceId] of asArray(work.sourceIds).entries()) {
      const source = sources.get(sourceId);
      if (source && !asArray(source.relatedWorkIds).includes(work.id)) {
        errors.push(
          `${path}.sourceIds[${sourceIndex}]: source "${sourceId}" does not link back to work "${work.id}"`,
        );
      }
    }

    for (const [ideaIndex, ideaId] of asArray(work.ideaIds).entries()) {
      const idea = ideas.get(ideaId);
      const hasWorkClaim = asArray(idea?.claimIds).some(
        (claimId) => claims.get(claimId)?.workId === work.id,
      );
      if (idea && !hasWorkClaim) {
        errors.push(
          `${path}.ideaIds[${ideaIndex}]: idea "${ideaId}" has no claim from work "${work.id}"`,
        );
      }
    }

    for (const [sourceIndex, sourceId] of asArray(
      work.preferredSourceIds,
    ).entries()) {
      const source = sources.get(sourceId);
      if (!asArray(work.sourceIds).includes(sourceId)) {
        errors.push(
          `${path}.preferredSourceIds[${sourceIndex}]: must also appear in sourceIds`,
        );
      }

      if (
        source &&
        !asArray(source.versionIds).includes(work.canonicalVersionId)
      ) {
        errors.push(
          `${path}.preferredSourceIds[${sourceIndex}]: source "${sourceId}" does not belong to canonical version "${work.canonicalVersionId}"`,
        );
      }
    }

    for (const [versionIndex, version] of asArray(work.versions).entries()) {
      if (!version || typeof version !== "object" || Array.isArray(version)) {
        continue;
      }

      checkReferences(
        version.sourceIds,
        sources,
        `${path}.versions[${versionIndex}].sourceIds`,
        errors,
      );

      for (const [sourceIndex, sourceId] of asArray(
        version.sourceIds,
      ).entries()) {
        const source = sources.get(sourceId);
        const sourcePath = `${path}.versions[${versionIndex}].sourceIds[${sourceIndex}]`;
        if (!asArray(work.sourceIds).includes(sourceId)) {
          errors.push(`${sourcePath}: must also appear in the work sourceIds`);
        }
        if (source && !asArray(source.relatedWorkIds).includes(work.id)) {
          errors.push(
            `${sourcePath}: source "${sourceId}" is unrelated to work "${work.id}"`,
          );
        }
        if (source && !asArray(source.versionIds).includes(version.id)) {
          errors.push(
            `${sourcePath}: source "${sourceId}" does not link back to version "${version.id}"`,
          );
        }
      }
    }

    for (const [eventIndex, event] of asArray(
      work.chronology?.events,
    ).entries()) {
      if (!event || typeof event !== "object" || Array.isArray(event)) {
        continue;
      }

      const eventPath = `${path}.chronology.events[${eventIndex}]`;
      checkDate(event.date, `${eventPath}.date`, errors);

      if (!versionIds.has(event.versionId)) {
        errors.push(`${eventPath}.versionId: unknown version "${event.versionId}"`);
      }

      checkReferences(event.sourceIds, sources, `${eventPath}.sourceIds`, errors);

      for (const [sourceIndex, sourceId] of asArray(
        event.sourceIds,
      ).entries()) {
        const source = sources.get(sourceId);
        if (!asArray(work.sourceIds).includes(sourceId)) {
          errors.push(
            `${eventPath}.sourceIds[${sourceIndex}]: must also appear in the work sourceIds`,
          );
        }
        if (source && !asArray(source.relatedWorkIds).includes(work.id)) {
          errors.push(
            `${eventPath}.sourceIds[${sourceIndex}]: source "${sourceId}" is unrelated to work "${work.id}"`,
          );
        }
      }

      let supportedPrecision = 0;
      for (const [evidenceIndex, evidence] of asArray(
        event.dateEvidence,
      ).entries()) {
        const evidencePath = `${eventPath}.dateEvidence[${evidenceIndex}]`;
        if (!asArray(event.sourceIds).includes(evidence.sourceId)) {
          errors.push(
            `${evidencePath}.sourceId: date evidence must also appear in the event sourceIds`,
          );
        }

        if (!sources.has(evidence.sourceId)) {
          errors.push(`${evidencePath}.sourceId: unknown source "${evidence.sourceId}"`);
        }

        supportedPrecision = Math.max(
          supportedPrecision,
          precisionRank[evidence.precision] ?? 0,
        );
      }

      if ((precisionRank[event.date?.precision] ?? 0) > supportedPrecision) {
        errors.push(
          `${eventPath}.date.precision: declared precision is finer than its source evidence`,
        );
      }
    }
  }

  for (const [sourceIndex, source] of asArray(corpus.sources).entries()) {
    if (!source || typeof source !== "object" || Array.isArray(source)) {
      continue;
    }

    const path = `sources[${sourceIndex}]`;
    checkFullDate(source.accessDate, `${path}.accessDate`, errors);
    checkNotAfter(source.accessDate, corpus.asOf, `${path}.accessDate`, errors);
    checkHttpsUrl(source.url, `${path}.url`, errors);

    if (
      asArray(source.supports).includes("claim-location") &&
      (!source.pagination ||
        !Number.isInteger(source.pagination.pageStart) ||
        !Number.isInteger(source.pagination.pageEnd))
    ) {
      errors.push(`${path}.pagination: claim-location sources need a page range`);
    }

    if (
      source.pagination &&
      source.pagination.pageEnd < source.pagination.pageStart
    ) {
      errors.push(`${path}.pagination: pageEnd precedes pageStart`);
    }

    const relatedWorks = [];
    for (const [workIndex, workId] of asArray(
      source.relatedWorkIds,
    ).entries()) {
      const work = works.get(workId);
      if (!work) {
        errors.push(`${path}.relatedWorkIds[${workIndex}]: unknown work "${workId}"`);
        continue;
      }

      relatedWorks.push(work);
      if (!asArray(work.sourceIds).includes(source.id)) {
        errors.push(`${path}.id: source is not listed by related work "${workId}"`);
      }
    }

    if (
      source.sourceClass !== "scholarly-history" &&
      asArray(source.versionIds).length === 0
    ) {
      errors.push(`${path}.versionIds: primary work sources need a version binding`);
    }

    for (const [versionIndex, versionId] of asArray(
      source.versionIds,
    ).entries()) {
      const ownerId = versionOwners.get(versionId);
      const matchingWork = ownerId ? works.get(ownerId) : undefined;
      if (
        !matchingWork ||
        !asArray(source.relatedWorkIds).includes(ownerId)
      ) {
        errors.push(
          `${path}.versionIds[${versionIndex}]: unknown version "${versionId}" for the related works`,
        );
        continue;
      }

      const version = asArray(matchingWork.versions).find(
        (item) => item?.id === versionId,
      );
      if (!asArray(version?.sourceIds).includes(source.id)) {
        errors.push(
          `${path}.versionIds[${versionIndex}]: version "${versionId}" does not list source "${source.id}"`,
        );
      }
    }
  }

  for (const [ideaIndex, idea] of asArray(corpus.ideas).entries()) {
    if (!idea || typeof idea !== "object" || Array.isArray(idea)) {
      continue;
    }

    const path = `ideas[${ideaIndex}]`;
    checkReferences(idea.claimIds, claims, `${path}.claimIds`, errors);
    checkPriorityText(idea.description, `${path}.description`, errors);

    for (const [claimIndex, claimId] of asArray(idea.claimIds).entries()) {
      const claim = claims.get(claimId);
      if (claim && !asArray(claim.ideaIds).includes(idea.id)) {
        errors.push(
          `${path}.claimIds[${claimIndex}]: claim "${claimId}" does not link back to idea "${idea.id}"`,
        );
      }
    }
  }

  for (const [claimIndex, claim] of asArray(corpus.claims).entries()) {
    if (!claim || typeof claim !== "object" || Array.isArray(claim)) {
      continue;
    }

    const path = `claims[${claimIndex}]`;

    if (!works.has(claim.workId)) {
      errors.push(`${path}.workId: unknown work "${claim.workId}"`);
    }

    checkReferences(claim.ideaIds, ideas, `${path}.ideaIds`, errors);
    checkFullDate(claim.checkedDate, `${path}.checkedDate`, errors);
    checkNotAfter(claim.checkedDate, corpus.asOf, `${path}.checkedDate`, errors);

    const claimWork = works.get(claim.workId);
    for (const [ideaIndex, ideaId] of asArray(claim.ideaIds).entries()) {
      if (claimWork && !asArray(claimWork.ideaIds).includes(ideaId)) {
        errors.push(
          `${path}.ideaIds[${ideaIndex}]: idea "${ideaId}" is not listed by work "${claim.workId}"`,
        );
      }
    }

    for (const [evidenceIndex, evidence] of asArray(
      claim.evidence,
    ).entries()) {
      if (
        priorityLanguage.test(evidence?.support ?? "") &&
        !claim.priorityReview
      ) {
        errors.push(
          `${path}.evidence[${evidenceIndex}].support: priority language requires an operational definition and prior-art review`,
        );
      }
      checkEvidence(
        evidence,
        `${path}.evidence[${evidenceIndex}]`,
        sources,
        errors,
        { expectedWorkIds: [claim.workId] },
      );
    }

    for (const [ideaIndex, ideaId] of asArray(claim.ideaIds).entries()) {
      const idea = ideas.get(ideaId);
      if (idea && !asArray(idea.claimIds).includes(claim.id)) {
        errors.push(
          `${path}.ideaIds[${ideaIndex}]: idea "${ideaId}" does not link back to claim "${claim.id}"`,
        );
      }
    }

    if (priorityLanguage.test(claim.statement ?? "") && !claim.priorityReview) {
      errors.push(
        `${path}.statement: priority language requires an operational definition and prior-art review`,
      );
    }

    if (claim.priorityReview) {
      checkReferences(
        claim.priorityReview.sourceIds,
        sources,
        `${path}.priorityReview.sourceIds`,
        errors,
      );
    }
  }

  const connectionTypes = new Set(
    schema?.$defs?.relationship?.properties?.connectionType?.enum ?? [],
  );
  const evidenceClasses = new Set(
    schema?.$defs?.relationship?.properties?.evidenceClass?.enum ?? [],
  );

  for (const [relationshipIndex, relationship] of asArray(
    corpus.relationships,
  ).entries()) {
    if (
      !relationship ||
      typeof relationship !== "object" ||
      Array.isArray(relationship)
    ) {
      continue;
    }

    const path = `relationships[${relationshipIndex}]`;

    if (!connectionTypes.has(relationship.connectionType)) {
      errors.push(
        `${path}.connectionType: unknown relationship type "${relationship.connectionType}"`,
      );
    }

    if (!evidenceClasses.has(relationship.evidenceClass)) {
      errors.push(
        `${path}.evidenceClass: unknown evidence class "${relationship.evidenceClass}"`,
      );
    }

    checkNodeReference(relationship.from, `${path}.from`, works, ideas, errors);
    checkNodeReference(relationship.to, `${path}.to`, works, ideas, errors);
    checkReferences(relationship.claimIds, claims, `${path}.claimIds`, errors);
    checkPriorityText(relationship.rationale, `${path}.rationale`, errors);

    const endpointWorkIds = [relationship.from, relationship.to]
      .filter((reference) => reference?.kind === "work")
      .map((reference) => reference.id);
    const endpointIdeaIds = new Set(
      [relationship.from, relationship.to]
        .filter((reference) => reference?.kind === "idea")
        .map((reference) => reference.id),
    );
    const relationshipClaims = asArray(relationship.claimIds)
      .map((claimId) => claims.get(claimId))
      .filter(Boolean);

    for (const [claimIndex, claimId] of asArray(
      relationship.claimIds,
    ).entries()) {
      const claim = claims.get(claimId);
      if (
        claim &&
        !endpointWorkIds.includes(claim.workId) &&
        !asArray(claim.ideaIds).some((ideaId) => endpointIdeaIds.has(ideaId))
      ) {
        errors.push(
          `${path}.claimIds[${claimIndex}]: claim "${claimId}" is unrelated to either endpoint`,
        );
      }
    }

    for (const endpoint of [relationship.from, relationship.to]) {
      const hasEndpointClaim = asArray(relationship.claimIds).some((claimId) => {
        const claim = claims.get(claimId);
        return endpoint?.kind === "work"
          ? claim?.workId === endpoint.id
          : asArray(claim?.ideaIds).includes(endpoint?.id);
      });
      if (endpoint?.id && !hasEndpointClaim) {
        errors.push(
          `${path}.claimIds: no claim supports the ${endpoint.kind} endpoint "${endpoint.id}"`,
        );
      }
    }

    const evidenceWorkIds = new Set(endpointWorkIds);
    for (const claim of relationshipClaims) {
      if (
        endpointWorkIds.includes(claim.workId) ||
        asArray(claim.ideaIds).some((ideaId) => endpointIdeaIds.has(ideaId))
      ) {
        evidenceWorkIds.add(claim.workId);
      }
    }
    const targetWorkIds =
      relationship.to?.kind === "work"
        ? [relationship.to.id]
        : relationshipClaims
            .filter((claim) =>
              asArray(claim.ideaIds).includes(relationship.to?.id),
            )
            .map((claim) => claim.workId);

    if (
      relationship.from?.kind === relationship.to?.kind &&
      relationship.from?.id === relationship.to?.id
    ) {
      errors.push(`${path}: relationship must connect two different nodes`);
    }

    for (const [evidenceIndex, evidence] of asArray(
      relationship.sourceEvidence,
    ).entries()) {
      checkPriorityText(
        evidence?.support,
        `${path}.sourceEvidence[${evidenceIndex}].support`,
        errors,
      );
      if (strongCausalLanguage.test(evidence?.support ?? "")) {
        errors.push(
          `${path}.sourceEvidence[${evidenceIndex}].support: strong causal wording exceeds the typed and sourced relationship`,
        );
      }
      if (
        relationship.causalLanguage === "prohibited" &&
        prohibitedCausalLanguage.test(evidence?.support ?? "")
      ) {
        errors.push(
          `${path}.sourceEvidence[${evidenceIndex}].support: causal wording is prohibited for this relationship`,
        );
      }
      checkEvidence(
        evidence,
        `${path}.sourceEvidence[${evidenceIndex}]`,
        sources,
        errors,
        {
          expectedWorkIds: [...evidenceWorkIds],
          requiredWorkIds:
            relationship.evidenceClass === "documented-influence"
              ? targetWorkIds
              : [],
        },
      );
    }

    if (
      relationship.evidenceClass === "documented-influence" &&
      asArray(relationship.sourceEvidence).length === 0
    ) {
      errors.push(
        `${path}.sourceEvidence: documented influence requires direct source evidence`,
      );
    }

    if (
      relationship.causalLanguage === "qualified" &&
      relationship.evidenceClass !== "documented-influence"
    ) {
      errors.push(
        `${path}.causalLanguage: only documented influence may use qualified causal language`,
      );
    }

    if (
      relationship.causalLanguage === "qualified" &&
      relationship.connectionType === "conceptual-parallel"
    ) {
      errors.push(
        `${path}.causalLanguage: a conceptual parallel must remain noncausal`,
      );
    }

    if (
      relationship.connectionType === "conceptual-parallel" &&
      relationship.evidenceClass === "documented-influence"
    ) {
      errors.push(
        `${path}.evidenceClass: a conceptual parallel cannot claim documented influence`,
      );
    }

    if (strongCausalLanguage.test(relationship.rationale ?? "")) {
      errors.push(
        `${path}.rationale: strong causal wording exceeds the typed and sourced relationship`,
      );
    }

    if (
      relationship.causalLanguage === "prohibited" &&
      prohibitedCausalLanguage.test(relationship.rationale ?? "")
    ) {
      errors.push(
        `${path}.rationale: causal wording is prohibited for this relationship`,
      );
    }

    const chronologicalTypes = new Set([
      "builds-on",
      "extends",
      "combines",
      "makes-practical",
      "enables",
      "conceptual-parallel",
    ]);
    if (
      chronologicalTypes.has(relationship.connectionType) &&
      relationship.from?.kind === "work" &&
      relationship.to?.kind === "work"
    ) {
      const fromOrder = orderingInterval(works.get(relationship.from.id));
      const toOrder = orderingInterval(works.get(relationship.to.id));
      if (fromOrder && toOrder && fromOrder.start > toOrder.end) {
        errors.push(
          `${path}: ${relationship.connectionType} must run from the earlier work to the later work`,
        );
      }
    }
  }

  const learningModesByWork = new Map(
    [...works.keys()].map((workId) => [workId, new Set()]),
  );

  for (const [objectiveIndex, objective] of asArray(
    corpus.learningObjectives,
  ).entries()) {
    if (!objective || typeof objective !== "object" || Array.isArray(objective)) {
      continue;
    }

    const path = `learningObjectives[${objectiveIndex}]`;
    checkReferences(objective.workIds, works, `${path}.workIds`, errors);
    checkReferences(objective.ideaIds, ideas, `${path}.ideaIds`, errors);
    checkReferences(objective.claimIds, claims, `${path}.claimIds`, errors);
    checkPriorityText(objective.objective, `${path}.objective`, errors);
    checkPriorityText(
      objective.successCriterion,
      `${path}.successCriterion`,
      errors,
    );

    for (const [claimIndex, claimId] of asArray(
      objective.claimIds,
    ).entries()) {
      const claim = claims.get(claimId);
      if (claim && !asArray(objective.workIds).includes(claim.workId)) {
        errors.push(
          `${path}.claimIds[${claimIndex}]: claim "${claimId}" is unrelated to the objective work(s)`,
        );
      }
      if (
        claim &&
        !asArray(claim.ideaIds).some((ideaId) =>
          asArray(objective.ideaIds).includes(ideaId),
        )
      ) {
        errors.push(
          `${path}.claimIds[${claimIndex}]: claim "${claimId}" does not support an objective idea`,
        );
      }
    }

    for (const [ideaIndex, ideaId] of asArray(objective.ideaIds).entries()) {
      const isSupported = asArray(objective.claimIds).some((claimId) =>
        asArray(claims.get(claimId)?.ideaIds).includes(ideaId),
      );
      if (ideas.has(ideaId) && !isSupported) {
        errors.push(
          `${path}.ideaIds[${ideaIndex}]: idea "${ideaId}" is not supported by an objective claim`,
        );
      }
    }

    for (const [workIndex, workId] of asArray(objective.workIds).entries()) {
      const hasWorkClaim = asArray(objective.claimIds).some(
        (claimId) => claims.get(claimId)?.workId === workId,
      );
      if (!hasWorkClaim) {
        errors.push(
          `${path}.workIds[${workIndex}]: work "${workId}" has no supporting claim in this objective`,
        );
        continue;
      }
      learningModesByWork.get(workId)?.add(objective.mode);
    }
  }

  for (const [workId, modes] of learningModesByWork.entries()) {
    const status = works.get(workId)?.inclusion?.status;
    if (["candidate", "context", "excluded"].includes(status)) {
      continue;
    }

    for (const mode of ["beginner", "expert"]) {
      if (!modes.has(mode)) {
        errors.push(
          `learningObjectives: included work "${workId}" has no ${mode} objective`,
        );
      }
    }
  }
}

export function validateCorpus(corpus, schema) {
  const errors = [];
  validateJsonSchema(corpus, schema, schema, "$", errors);
  semanticValidation(corpus, schema, errors);
  return [...new Set(errors)];
}
