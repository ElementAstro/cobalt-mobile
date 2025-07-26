"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Activity, Target } from "lucide-react";
import { useAutoFocus } from "../hooks/use-autofocus";
import { useTranslation } from "@/lib/i18n";

export default function FocusCurve() {
  const {
    samples,
    bestPosition,
    bestHfr,
    curve,
    getStatistics,
  } = useAutoFocus();

  const { t } = useTranslation();
  const statistics = getStatistics();

  if (samples.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {t("focusCurve")}
          </div>
          {curve && (
            <Badge variant={curve.isValid ? "default" : "destructive"}>
              {curve.isValid ? t("validCurve") : t("invalidCurve")}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Chart Placeholder */}
        <div className="h-48 bg-muted rounded-lg flex items-center justify-center mb-4">
          <div className="text-center text-muted-foreground">
            <Activity className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">{t("focusCurve")} visualization</p>
            <p className="text-xs">
              {t("showing")} {samples.length} {t("dataPoints")}
            </p>
            {bestPosition && (
              <div className="mt-2 flex items-center justify-center gap-1 text-xs">
                <Target className="h-3 w-3" />
                {t("bestFocus")}: {bestPosition.toLocaleString()}
              </div>
            )}
          </div>
        </div>

        {/* Sample Data Visualization */}
        <div className="space-y-4">
          {/* Best Focus Indicator */}
          {bestPosition && bestHfr && (
            <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  <span className="font-medium">{t("optimalFocus")}</span>
                </div>
                <Badge variant="default">
                  {bestPosition.toLocaleString()} @ {bestHfr.toFixed(2)} HFR
                </Badge>
              </div>
            </div>
          )}

          {/* Curve Analysis */}
          {curve && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="font-bold text-lg">
                  {curve.r2.toFixed(3)}
                </div>
                <div className="text-muted-foreground">R² {t("coefficient")}</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg">
                  {(curve.confidence * 100).toFixed(1)}%
                </div>
                <div className="text-muted-foreground">{t("confidence")}</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg">
                  {curve.leftSlope.toFixed(3)}
                </div>
                <div className="text-muted-foreground">{t("leftSlope")}</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-lg">
                  {curve.rightSlope.toFixed(3)}
                </div>
                <div className="text-muted-foreground">{t("rightSlope")}</div>
              </div>
            </div>
          )}

          {/* Statistics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium">{t("minHFR")}:</span>
              <span className="ml-2">{statistics.minHfr.toFixed(2)}</span>
            </div>
            <div>
              <span className="font-medium">{t("maxHFR")}:</span>
              <span className="ml-2">{statistics.maxHfr.toFixed(2)}</span>
            </div>
            <div>
              <span className="font-medium">{t("range")}:</span>
              <span className="ml-2">{statistics.range.toLocaleString()}</span>
            </div>
            <div>
              <span className="font-medium">{t("samples")}:</span>
              <span className="ml-2">{statistics.sampleCount}</span>
            </div>
          </div>

          {/* Sample Data Table */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">{t("sampleData")}</h4>
            <div className="max-h-32 overflow-y-auto border rounded-lg">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="text-left p-2">#</th>
                    <th className="text-left p-2">{t("position")}</th>
                    <th className="text-left p-2">HFR</th>
                    <th className="text-left p-2">{t("stars")}</th>
                  </tr>
                </thead>
                <tbody>
                  {samples.map((sample, index) => (
                    <tr 
                      key={index} 
                      className={`border-t ${
                        sample.position === bestPosition ? 'bg-primary/10' : ''
                      }`}
                    >
                      <td className="p-2">{index + 1}</td>
                      <td className="p-2 font-mono">
                        {sample.position.toLocaleString()}
                        {sample.position === bestPosition && (
                          <Target className="inline h-3 w-3 ml-1 text-primary" />
                        )}
                      </td>
                      <td className="p-2 font-mono">{sample.hfr.toFixed(2)}</td>
                      <td className="p-2">{sample.starCount || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quality Assessment */}
          {curve && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm">{t("qualityAssessment")}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span>{t("curveValidity")}:</span>
                  <Badge variant={curve.isValid ? "default" : "destructive"} className="text-xs">
                    {curve.isValid ? t("valid" as any) : t("invalid" as any)}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>{t("dataQuality" as any)}:</span>
                  <Badge 
                    variant={curve.r2 > 0.8 ? "default" : curve.r2 > 0.6 ? "secondary" : "destructive"} 
                    className="text-xs"
                  >
                    {curve.r2 > 0.8 ? t("excellent" as any) : curve.r2 > 0.6 ? t("good" as any) : t("poor" as any)}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
