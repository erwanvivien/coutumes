'use client';

import { Delta } from '@/components/report/Delta';
import {
  formatCompact,
  formatEuro,
  formatEuroCents,
  formatInteger,
  formatSignedPercent,
} from '@/lib/report/format';
import { weekdayName } from '@/lib/report/months';
import { relativeChange, type WeekRecap } from '@/lib/report/weeks';
import { useState } from 'react';
import styles from './charts.module.css';
import { columnPath, linear, niceTicks } from './scale';
import { Legend, Tooltip, TooltipRow } from './Tooltip';
import { useWidth } from './useWidth';

const HEIGHT = 260;
const MARGIN = { top: 12, right: 8, bottom: 28, left: 52 };

/** CA per day of the week as columns, next to the same weekday of S-1, with the day's objective
 * as a target tick across the week's column. */
export const WeekChart: React.FC<{ recap: WeekRecap }> = ({ recap }) => {
  const [ref, width] = useWidth<HTMLDivElement>(960);
  const [hovered, setHovered] = useState<number | undefined>(undefined);

  const max = Math.max(
    0,
    ...recap.days.flatMap((day) => [day.entry?.revenue ?? 0, day.entry?.objective ?? 0]),
    ...recap.previousDays.map((day) => day.entry?.revenue ?? 0),
  );
  const ticks = niceTicks(max);

  const plotWidth = width - MARGIN.left - MARGIN.right;
  const band = plotWidth / 7;
  const barWidth = Math.max(4, Math.min(36, (band - 16) / 2));
  const baseline = HEIGHT - MARGIN.bottom;
  const y = linear([0, ticks[ticks.length - 1]], [baseline, MARGIN.top]);
  const bandX = (index: number) => MARGIN.left + index * band;

  const hoveredDay = hovered === undefined ? undefined : recap.days[hovered];
  const hoveredPrevious = hovered === undefined ? undefined : recap.previousDays[hovered];

  return (
    <figure className={styles.figure}>
      <Legend
        items={[
          { label: 'Semaine', series: 'revenue', shape: 'rect' },
          { label: 'S-1', series: 'previous', shape: 'rect' },
          { label: 'Objectif du jour', series: 'objective', shape: 'line' },
        ]}
      />
      <div ref={ref} className={styles.plot} onPointerLeave={() => setHovered(undefined)}>
        <svg
          width={width}
          height={HEIGHT}
          viewBox={`0 0 ${width} ${HEIGHT}`}
          className={styles.svg}
          role="img"
          aria-label="Chiffre d’affaires par jour de la semaine, comparé à la semaine précédente"
        >
          {ticks.map((tick) => (
            <g key={tick}>
              <line
                x1={MARGIN.left}
                x2={width - MARGIN.right}
                y1={y(tick)}
                y2={y(tick)}
                className={tick === 0 ? styles.baseline : styles.grid}
              />
              <text x={MARGIN.left - 8} y={y(tick)} className={styles.yTick}>
                {tick === 0 ? '0' : `${formatCompact(tick)} €`}
              </text>
            </g>
          ))}

          {recap.days.map((day, index) => {
            const previous = recap.previousDays[index].entry?.revenue;
            const current = day.entry?.revenue;
            const objective = day.entry?.objective;
            const x = bandX(index);
            const center = x + band / 2;
            const currentX = center + 1;
            const previousX = center - 1 - barWidth;

            return (
              <g key={day.date}>
                {hovered === index && (
                  <rect
                    x={x}
                    y={MARGIN.top}
                    width={band}
                    height={baseline - MARGIN.top}
                    className={styles.hoverBand}
                  />
                )}
                {previous !== undefined && (
                  <path
                    d={columnPath(previousX, y(previous), barWidth, baseline)}
                    className={styles.columnPrevious}
                  />
                )}
                {current !== undefined && (
                  <path
                    d={columnPath(currentX, y(current), barWidth, baseline)}
                    className={styles.column}
                  />
                )}
                {objective !== undefined && (
                  <line
                    x1={currentX - 4}
                    x2={currentX + barWidth + 4}
                    y1={y(objective)}
                    y2={y(objective)}
                    className={styles.targetTick}
                  />
                )}
                <text x={center} y={baseline + 18} className={styles.xTick}>
                  {band >= 64
                    ? `${weekdayName(day.month, day.day).slice(0, 3).toLowerCase()}. ${day.day}`
                    : `${weekdayName(day.month, day.day).charAt(0)} ${day.day}`}
                </text>
                <rect
                  x={x}
                  y={MARGIN.top}
                  width={band}
                  height={baseline - MARGIN.top}
                  className={styles.hit}
                  tabIndex={0}
                  aria-label={`${weekdayName(day.month, day.day)} ${day.day} : ${formatEuro(current)}`}
                  onPointerEnter={() => setHovered(index)}
                  onFocus={() => setHovered(index)}
                  onBlur={() => setHovered(undefined)}
                />
              </g>
            );
          })}
        </svg>

        {hovered !== undefined && hoveredDay !== undefined && (
          <Tooltip
            x={bandX(hovered) + band / 2}
            width={width}
            title={`${weekdayName(hoveredDay.month, hoveredDay.day)} ${hoveredDay.day}`}
          >
            <TooltipRow
              swatch="revenue"
              label="Réalisé"
              value={formatEuro(hoveredDay.entry?.revenue)}
            />
            <TooltipRow
              swatch="previous"
              label="S-1"
              value={formatEuro(hoveredPrevious?.entry?.revenue)}
            />
            <TooltipRow
              label="vs S-1"
              value={
                <Delta
                  value={relativeChange(hoveredDay.entry?.revenue, hoveredPrevious?.entry?.revenue)}
                  format={formatSignedPercent}
                />
              }
            />
            <TooltipRow
              swatch="objective"
              label="Objectif"
              value={formatEuro(hoveredDay.entry?.objective)}
            />
            <TooltipRow label="Tickets" value={formatInteger(hoveredDay.entry?.tickets)} />
            <TooltipRow
              label="Panier moyen"
              value={formatEuroCents(
                hoveredDay.entry?.revenue !== undefined && hoveredDay.entry.tickets
                  ? hoveredDay.entry.revenue / hoveredDay.entry.tickets
                  : undefined,
              )}
            />
          </Tooltip>
        )}
      </div>
    </figure>
  );
};
