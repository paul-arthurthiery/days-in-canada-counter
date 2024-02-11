import { FunctionComponent, useContext } from 'react';

import dayjs from 'dayjs';
import minMax from 'dayjs/plugin/minMax';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

import { ResidencyDatesContext } from '../../context/ResidencyDatesContext';
import { DATE_FORMAT } from '../../utils/constants';
import {
  getAccumulatedCitizenshipDays,
  getAccumulatedResidencyDays,
  getDaysInCanada,
  getIsInCanada,
} from '../../utils/entryExitUtils';
import {
  getAllEntriesAndExits,
  getCitizenshipDaysPercentOverTime,
  getResidencyDaysPercentOverTime,
} from '../../utils/graphUtils';
import { CitizenshipGraph } from '../citizenshipGraph/CitizenshipGraph';
import { ProgressSection } from '../progressSection/ProgressSection';

dayjs.extend(minMax);
dayjs.extend(utc);
dayjs.extend(timezone);

export const Dashboard: FunctionComponent = () => {
  const allResidencyInfo = useContext(ResidencyDatesContext);
  const daysInCanada = getDaysInCanada(allResidencyInfo);
  const isInCanada = getIsInCanada(daysInCanada);
  const residencyDays = Math.floor(getAccumulatedResidencyDays(daysInCanada));
  const citizenshipDays = Math.floor(getAccumulatedCitizenshipDays(daysInCanada));
  const { neededDaysCitizenship, neededDaysResidency, residencyDate } = allResidencyInfo;
  const graphInfo = {
    allEntriesAndExits: getAllEntriesAndExits(daysInCanada),
    citizenshipDaysPercentOverTime: getCitizenshipDaysPercentOverTime(neededDaysCitizenship, daysInCanada),
    residencyDaysPercentOverTime: getResidencyDaysPercentOverTime(neededDaysResidency, daysInCanada),
  };
  // const leaveCanada = () => updateEntryExit(false);
  // const enterCanada = () => updateEntryExit(true);
  // const updateEntryExit = (entry: boolean) => {
  //  fetch(entry ? "/entry": "/exit", {
  //    method: 'POST',
  //      headers: {
  //        'Content-Type': 'application/json',
  //      },
  //      body: JSON.stringify({ date: new Date().toISOString().substring(0, 10) })
  //    })
  //    .then((response) => response.json())
  //     .then((allResidencyInfo: AllResidencyInfo & {ok: boolean}) =>
  //        allResidencyInfo.ok ? updateAllResidencyInfo(allResidencyInfo) : setInCanada(!entry))
  //    .catch(() => setInCanada(!entry))
  // };
  return (
    <>
      <h1>Immigration Status Day Counter</h1>
      <ProgressSection
        residencyDays={residencyDays}
        citizenshipDays={citizenshipDays}
        neededDaysCitizenship={neededDaysCitizenship}
        neededDaysResidency={neededDaysResidency}
        residencyDate={residencyDate}
      />
      <p>Soonest date to ask for citizenship: {daysInCanada?.soonestTimestampCitizen().format(DATE_FORMAT)}</p>
      <p>
        <span>
          Currently {!isInCanada && 'not'} in Canada {isInCanada ? '🇨🇦' : '🌴'}
        </span>
        {/* {inCanada
              ? <Button variant="danger" onClick={leaveCanada}>I've left Canada</Button>
              : <Button variant="primary" onClick={enterCanada}>I've returned to Canada</Button>
            } */}
      </p>
      {!!graphInfo.allEntriesAndExits?.length && <CitizenshipGraph graphData={graphInfo} />}
    </>
  );
};
