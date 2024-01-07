import { styled, useStyletron } from 'baseui';
import { Block } from 'baseui/block';
import { StatefulPopover, TRIGGER_TYPE } from 'baseui/popover';
import { ProgressBarRounded } from 'baseui/progress-bar';
import dayjs, { Dayjs } from 'dayjs';

import { DATE_FORMAT } from '../utils/constants';

interface ProgressSectionProps {
  residencyDays: number;
  citizenshipDays: number;
  neededDaysResidency: number;
  neededDaysCitizenship: number;
  residencyDate: Dayjs;
}

interface PopoverBlockProps {
  children: React.ReactNode;
}

const FlexDiv = styled('div', {
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'space-evenly',
});

const FlexColumnDiv = styled('div', {
  display: 'flex',
  flexDirection: 'column',
});

const StyledPopoverBlock = ({ children }: PopoverBlockProps) => {
  const [css, theme] = useStyletron();
  return (
    <Block padding='20px' className={css({ fontFamily: theme.typography.ParagraphXSmall.fontFamily })}>
      {children}
    </Block>
  );
};

export default ({
  residencyDays,
  citizenshipDays,
  neededDaysResidency,
  neededDaysCitizenship,
  residencyDate,
}: ProgressSectionProps) => (
  <>
    <span>Became a resident on {dayjs(residencyDate).format(DATE_FORMAT)}</span>
    <FlexDiv>
      <FlexColumnDiv>
        <p>Citizenship</p>
        <StatefulPopover
          content={() => (
            <StyledPopoverBlock>
              <span>Citizenship Days: {citizenshipDays}</span>
            </StyledPopoverBlock>
          )}
          triggerType={TRIGGER_TYPE.hover}
          returnFocus
          autoFocus
        >
          <div>
            <ProgressBarRounded progress={citizenshipDays / neededDaysCitizenship} />
          </div>
        </StatefulPopover>
      </FlexColumnDiv>
      <FlexColumnDiv>
        <p>Residency</p>
        <StatefulPopover
          content={() => (
            <StyledPopoverBlock>
              <span>Residency Days: {residencyDays}</span>
            </StyledPopoverBlock>
          )}
          triggerType={TRIGGER_TYPE.hover}
          returnFocus
          autoFocus
        >
          <div>
            <ProgressBarRounded
              progress={residencyDays / neededDaysResidency}
              overrides={{
                TrackForeground: {
                  style: ({ $theme }) => ({
                    stroke: $theme.colors.contentPositive,
                  }),
                },
              }}
            />
          </div>
        </StatefulPopover>
      </FlexColumnDiv>
    </FlexDiv>
  </>
);
