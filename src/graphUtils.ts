import { Dayjs } from 'dayjs';

import { DaysInCanadaRecord } from './types';

const getPartialSumsInSpans = (spans: { amount: number }[], initialSum = 0) =>
  spans.reduce((acc: number[], { amount }) => {
    acc.push(acc[acc.length - 1] ?? initialSum);
    acc.push((acc[acc.length - 1] ?? initialSum) + amount);
    return acc;
  }, []);

export const getResidencyDaysPercentOverTime = (neededDaysResidency: number, { past, future }: DaysInCanadaRecord) => {
  const numberOfSpansBeforeResidency = past.beforeResidency.concat(future.beforeResidency).length;
  const cumulativeResidencyDays = getPartialSumsInSpans(past.afterResidency.concat(future.afterResidency));
  return Array(numberOfSpansBeforeResidency * 2)
    .fill(0)
    .concat(cumulativeResidencyDays.map((amount) => Math.min((amount * 100) / neededDaysResidency, 100)));
};

export const getCitizenshipDaysPercentOverTime = (
  neededDaysCitizenship: number,
  { past, future }: DaysInCanadaRecord,
) => {
  const cumulativeCitizenshipDaysBeforeResidency = getPartialSumsInSpans(
    past.beforeResidency.concat(future.beforeResidency),
  ).map((amount) => Math.min(amount / 2, 365));
  const cumulativeCitizenshipDaysAfterResidency = getPartialSumsInSpans(
    past.afterResidency.concat(future.afterResidency),
    cumulativeCitizenshipDaysBeforeResidency[cumulativeCitizenshipDaysBeforeResidency.length - 1],
  );
  return cumulativeCitizenshipDaysBeforeResidency
    .concat(cumulativeCitizenshipDaysAfterResidency)
    .map((amount) => Math.min((amount * 100) / neededDaysCitizenship, 100));
};

const getListOfEntryExitFromSpans = (spans: { entry: Dayjs; exit: Dayjs }[]) =>
  spans.flatMap(({ entry, exit }) => [entry, exit]);

export const getAllEntriesAndExits = (record: DaysInCanadaRecord) =>
  getListOfEntryExitFromSpans(record.past.beforeResidency)
    .concat(getListOfEntryExitFromSpans(record.past.afterResidency))
    .concat(getListOfEntryExitFromSpans(record.future.beforeResidency))
    .concat(getListOfEntryExitFromSpans(record.future.afterResidency));
