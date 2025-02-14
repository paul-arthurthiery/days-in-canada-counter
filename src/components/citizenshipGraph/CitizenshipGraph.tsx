import { useStyletron } from 'baseui';
import dayjs from 'dayjs';
import { Line } from 'react-chartjs-2';

import { GraphData } from '../../types';
import './styles.scss';
import { DATE_FORMAT } from '../../utils/constants';

interface CitizenshipGraphProps {
  graphData: GraphData;
}

export const CitizenshipGraph = ({ graphData }: CitizenshipGraphProps) => {
  const [css, theme] = useStyletron();
  return (
    <div
      className={css({
        width: '100vw',
        height: '60vh',
        display: 'flex',
        alignItems: 'center',
        flexDirection: 'column',
      })}
    >
      <Line
        data={{
          labels: graphData.allEntriesAndExits.map((date) => date.format(DATE_FORMAT)),
          datasets: [
            {
              label: 'Citizenship days',
              data: graphData.citizenshipDaysPercentOverTime,
              pointStyle: false,
              borderColor: theme.colors.contentAccent,
              backgroundColor: theme.colors.contentAccent,
            },
            {
              label: 'Residency renewal days',
              data: graphData.residencyDaysPercentOverTime,
              pointStyle: false,
              borderColor: theme.colors.contentPositive,
              backgroundColor: theme.colors.contentPositive,
            },
          ],
        }}
        options={{
          plugins: {
            datalabels: {
              formatter: (value, { dataIndex, dataset }) => {
                if (dataIndex === dataset.data.length - 1) {
                  return graphData.allEntriesAndExits.at(-1)?.format(DATE_FORMAT);
                }
                return '';
              },
              align: 'left',
              backgroundColor: ({ dataIndex, dataset }) =>
                dataIndex === dataset.data.length - 1 ? theme.colors.contentPrimary : '',
              borderColor: ({ dataIndex, dataset }) =>
                dataIndex === dataset.data.length - 1 ? theme.colors.contentAccent : '',
              borderWidth: 1,
            },
            legend: {
              labels: {
                color: theme.colors.contentPrimary,
              },
            },
            annotation: {
              annotations: {
                line1: {
                  type: 'line',
                  scaleID: 'x',
                  value: dayjs().valueOf(),
                  borderColor: 'rgb(255, 99, 132)',
                  borderWidth: 2,
                },
              },
            },
            tooltip: {
              callbacks: {
                label(context) {
                  // return the number of citizenship days instead of the percentage
                  return `${context.dataset.label}: ${(context.parsed.y * graphData.neededDaysCitizenship) / 100}`;
                },
              },
            },
          },
          responsive: true,
          scales: {
            x: {
              type: 'time',
              time: {
                unit: 'month',
              },
              ticks: {
                maxTicksLimit: 30,
                color: theme.colors.contentPrimary,
              },
              grid: {
                drawTicks: true,
                tickWidth: 0,
              },
            },
            y: {
              beginAtZero: true,
              ticks: {
                callback(value) {
                  return `${value}%`;
                },
                color: theme.colors.contentPrimary,
              },
              grid: {
                drawTicks: true,
                color: theme.colors.backgroundTertiary,
                tickWidth: 0,
              },
            },
          },
          animations: {
            radius: {
              duration: 400,
              easing: 'linear',
              loop: (context) => context.active,
            },
          },
        }}
      />
    </div>
  );
};
