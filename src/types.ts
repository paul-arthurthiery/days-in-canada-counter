import { Dayjs } from 'dayjs';

export interface AllResidencyInfo {
  entries: Dayjs[];
  exits: Dayjs[];
  residencyDate: Dayjs;
  neededDaysResidency: number;
  neededDaysCitizenship: number;
}

export interface SpanInCanada {
  entry: Dayjs;
  exit: Dayjs;
  amount: number;
}

export interface DaysInCanadaRecord {
  past: {
    beforeResidency: SpanInCanada[];
    afterResidency: SpanInCanada[];
  };
  future: {
    beforeResidency: SpanInCanada[];
    afterResidency: SpanInCanada[];
  };
  soonestTimestampCitizen: () => Dayjs;
}

export const getDefaultDaysInCanadaRecord: () => DaysInCanadaRecord = () => ({
  past: {
    beforeResidency: [],
    afterResidency: [],
  },
  future: {
    beforeResidency: [],
    afterResidency: [],
  },
  soonestTimestampCitizen() {
    return (
      this.future.afterResidency.at(-1)?.exit ??
      (() => {
        throw new Error('cannot become resident');
      })()
    );
  },
});

export interface GraphData {
  allEntriesAndExits: Dayjs[];
  citizenshipDaysPercentOverTime: number[];
  residencyDaysPercentOverTime: number[];
}
