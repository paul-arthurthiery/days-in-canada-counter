import { useState, useEffect, FunctionComponent } from 'react';

import dayjs from 'dayjs';
import minMax from 'dayjs/plugin/minMax';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

import CitizenshipGraph from '../citizenshipGraph/CitizenshipGraph';
import ProgressSection from '../progressSection/ProgressSection';
import { AllResidencyInfo, DaysInCanadaRecord, GraphData } from '../types';
import { DATE_FORMAT } from '../utils/constants';
import {
  getAccumulatedCitizenshipDays,
  getAccumulatedResidencyDays,
  getDaysInCanada,
  getIsInCanada,
} from '../utils/entryExitUtils';
import {
  getAllEntriesAndExits,
  getCitizenshipDaysPercentOverTime,
  getResidencyDaysPercentOverTime,
} from '../utils/graphUtils';

dayjs.extend(minMax);
dayjs.extend(utc);
dayjs.extend(timezone);

const Dashboard: FunctionComponent<{ allResidencyInfo: AllResidencyInfo }> = ({ allResidencyInfo }) => {
  const [daysInCanada, setDaysInCanada] = useState<null | DaysInCanadaRecord>(null);
  const [residencyDays, setResidencyDays] = useState(0);
  const [citizenshipDays, setCitizenshipDays] = useState(0);
  const [isInCanada, setInCanada] = useState<boolean>(false);
  const [graphInfo, setGraphInfo] = useState({} as GraphData);
  const { neededDaysCitizenship, neededDaysResidency, residencyDate } = allResidencyInfo;
  useEffect(() => {
    if (allResidencyInfo === null) return;
    setDaysInCanada(getDaysInCanada(allResidencyInfo));
  }, [allResidencyInfo]);
  useEffect(() => {
    if (daysInCanada === null) return;
    setInCanada(getIsInCanada(daysInCanada)); // TODO: how to calculate this ?
    setResidencyDays(Math.floor(getAccumulatedResidencyDays(daysInCanada)));
    setCitizenshipDays(Math.floor(getAccumulatedCitizenshipDays(daysInCanada)));
  }, [daysInCanada]);
  useEffect(() => {
    if (allResidencyInfo === null || daysInCanada === null) return;
    setGraphInfo({
      allEntriesAndExits: getAllEntriesAndExits(daysInCanada),
      citizenshipDaysPercentOverTime: getCitizenshipDaysPercentOverTime(neededDaysCitizenship, daysInCanada),
      residencyDaysPercentOverTime: getResidencyDaysPercentOverTime(neededDaysResidency, daysInCanada),
    });
  }, [allResidencyInfo, daysInCanada]);
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
      {!!graphInfo.allEntriesAndExits?.length && <CitizenshipGraph graphData={graphInfo} dateFormat={DATE_FORMAT} />}
    </>
  );
};

export default Dashboard;
