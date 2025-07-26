"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Compass } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useTelescope } from "../hooks/use-telescope";
import { formatCoordinate } from "../utils/telescope.utils";

interface MountStatusProps {
  className?: string;
  compact?: boolean;
}

export default function MountStatus({ className, compact = false }: MountStatusProps) {
  const { mountStatus } = useTelescope();
  const { t } = useTranslation();

  const statusItems = [
    {
      key: 'tracking',
      label: t('tracking'),
      value: mountStatus.tracking,
      variant: mountStatus.tracking ? 'default' : 'secondary',
      text: mountStatus.tracking ? t('on') : t('off'),
    },
    {
      key: 'slewing',
      label: t('slewing'),
      value: mountStatus.slewing,
      variant: mountStatus.slewing ? 'destructive' : 'secondary',
      text: mountStatus.slewing ? t('active') : t('idle'),
    },
    {
      key: 'parked',
      label: t('parked'),
      value: mountStatus.parked,
      variant: mountStatus.parked ? 'default' : 'secondary',
      text: mountStatus.parked ? t('yes') : t('no'),
    },
    {
      key: 'aligned',
      label: t('aligned'),
      value: mountStatus.aligned,
      variant: mountStatus.aligned ? 'default' : 'destructive',
      text: mountStatus.aligned ? t('yes') : t('no'),
    },
    {
      key: 'guiding',
      label: t('guiding'),
      value: mountStatus.guiding,
      variant: mountStatus.guiding ? 'default' : 'secondary',
      text: mountStatus.guiding ? t('active') : t('inactive'),
    },
  ];

  if (compact) {
    return (
      <Card className={className}>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 gap-2">
            {statusItems.map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <span className="text-sm font-medium">{item.label}:</span>
                <Badge variant={item.variant as "default" | "secondary" | "destructive" | "outline"}>
                  {item.text}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Compass className="h-5 w-5" />
          {t("mountStatus")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">{t("rightAscension")}:</span>
              <span className="text-sm font-mono">
                {formatCoordinate(mountStatus.ra, 'ra')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">{t("declination")}:</span>
              <span className="text-sm font-mono">
                {formatCoordinate(mountStatus.dec, 'dec')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">{t("altitude")}:</span>
              <span className="text-sm font-mono">{mountStatus.alt}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">{t("azimuth")}:</span>
              <span className="text-sm font-mono">{mountStatus.az}</span>
            </div>
          </div>
          <div className="space-y-2">
            {statusItems.map((item) => (
              <div key={item.key} className="flex items-center justify-between">
                <span className="text-sm font-medium">{item.label}:</span>
                <Badge variant={item.variant as "default" | "secondary" | "destructive" | "outline"}>
                  {item.text}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
