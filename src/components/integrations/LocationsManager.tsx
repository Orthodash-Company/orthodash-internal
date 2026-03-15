'use client'

import { type Location, type DataCounts } from '@/shared/types';
import { PracticeSnapshot } from './PracticeSnapshot';

interface LocationsManagerProps {
  greyfinchData?: unknown;
  dashboardLocations?: Location[];
  isRefreshingGreyfinchData?: boolean;
  onRefreshGreyfinchData?: () => Promise<boolean>;
  initialCounts?: DataCounts;
  onCountsUpdate?: (counts: DataCounts) => void;
  onDataLoadingChange?: (isLoading: boolean) => void;
  restoredSnapshotDates?: { startDate: string; endDate: string } | null;
  onSnapshotDatesChange?: (startDate: string, endDate: string) => void;
}

export function LocationsManager({
  greyfinchData,
  dashboardLocations,
  isRefreshingGreyfinchData,
  onRefreshGreyfinchData,
  initialCounts,
  onCountsUpdate,
  onDataLoadingChange,
  restoredSnapshotDates,
  onSnapshotDatesChange,
}: LocationsManagerProps) {
  return (
    <PracticeSnapshot
      greyfinchData={greyfinchData}
      locations={dashboardLocations}
      isRefreshingGreyfinchData={isRefreshingGreyfinchData}
      onRefreshGreyfinchData={onRefreshGreyfinchData}
      initialCounts={initialCounts}
      onCountsUpdate={onCountsUpdate}
      onDataLoadingChange={onDataLoadingChange}
      restoredDates={restoredSnapshotDates}
      onDatesChange={onSnapshotDatesChange}
    />
  );
}
