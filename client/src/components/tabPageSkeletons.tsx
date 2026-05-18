import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TableCell, TableRow } from "@/components/ui/table";

export function CustomersKpiSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3">
      {[0, 1].map((i) => (
        <Card key={i} className="bg-card/80 border-border/40">
          <CardContent className="p-3 flex items-center gap-2.5">
            <Skeleton className="h-9 w-9 rounded-lg shrink-0" />
            <div className="space-y-2 flex-1 min-w-0">
              <Skeleton className="h-5 w-12" />
              <Skeleton className="h-3 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function CustomersSearchRowSkeleton() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Skeleton className="h-10 flex-1 min-w-[240px] max-w-sm rounded-md" />
      <Skeleton className="h-4 w-44 rounded-md ml-auto" />
    </div>
  );
}

export function CustomersTableSkeletonBody() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <TableRow key={i} className="border-border/30">
          <TableCell className="min-w-[180px]">
            <Skeleton className="h-4 w-32" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-3 w-44 max-w-[220px]" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-14 rounded-full" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-20 rounded-full" />
          </TableCell>
          <TableCell className="text-right">
            <Skeleton className="h-4 w-6 inline-block ml-auto" />
          </TableCell>
          <TableCell className="text-right">
            <Skeleton className="h-4 w-10 inline-block ml-auto" />
          </TableCell>
          <TableCell className="text-right">
            <Skeleton className="h-4 w-16 inline-block ml-auto" />
          </TableCell>
          <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
            <Skeleton className="h-3 w-24" />
          </TableCell>
          <TableCell className="w-20 text-right">
            <Skeleton className="h-7 w-14 inline-block ml-auto rounded-md" />
          </TableCell>
          <TableCell className="w-8">
            <Skeleton className="h-4 w-4 rounded" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

export function WorkersStatsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {[0, 1, 2].map((i) => (
        <Card key={i} className="bg-card/80 border-border/40">
          <CardContent className="p-4 flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
            <div className="space-y-2 min-w-0">
              <Skeleton className="h-6 w-14" />
              <Skeleton className="h-3 w-28" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function WorkersTypeChartSkeleton() {
  return (
    <Card className="bg-card/80 border-border/40 overflow-hidden">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row items-center justify-center gap-8 max-w-3xl mx-auto w-full">
          <Skeleton className="h-[280px] w-[280px] max-h-[280px] max-w-[280px] rounded-full shrink-0" />
          <div className="w-full lg:flex-1 lg:max-w-[300px] rounded-xl border border-border/30 bg-secondary/15 p-3 space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function WorkersSearchRowSkeleton() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Skeleton className="h-10 flex-1 min-w-[240px] max-w-sm rounded-md" />
      <Skeleton className="h-4 w-36 rounded-md ml-auto" />
    </div>
  );
}

export function WorkersTableSkeletonBody() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <TableRow key={i} className="border-border/30">
          <TableCell>
            <div className="flex items-center gap-2">
              <Skeleton className="h-7 w-7 rounded-md shrink-0" />
              <Skeleton className="h-4 w-32" />
            </div>
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-36" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-24 rounded-full" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-16 rounded-full" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-20" />
          </TableCell>
          <TableCell className="text-right">
            <Skeleton className="h-4 w-8 ml-auto" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-3 w-24" />
          </TableCell>
        </TableRow>
      ))}
    </>
  );
}

export function ConversationsSearchRowSkeleton() {
  return (
    <div className="flex items-center gap-2 w-full">
      <Skeleton className="h-8 flex-1 max-w-md rounded-md" />
      <Skeleton className="h-4 w-40 rounded-md ml-auto shrink-0" />
    </div>
  );
}

export function ConversationsTableSkeletonRows() {
  return (
    <>
      {Array.from({ length: 10 }).map((_, i) => (
        <tr key={i} className="border-b border-border/15">
          <td className="px-4 py-2.5">
            <Skeleton className="h-3 w-14" />
          </td>
          <td className="px-3 py-2.5">
            <Skeleton className="h-4 w-36" />
          </td>
          <td className="px-3 py-2.5">
            <Skeleton className="h-4 w-32" />
          </td>
          <td className="px-3 py-2.5">
            <Skeleton className="h-4 w-28" />
          </td>
          <td className="px-3 py-2.5">
            <Skeleton className="h-4 w-14" />
          </td>
          <td className="px-3 py-2.5">
            <Skeleton className="h-3 w-28" />
          </td>
        </tr>
      ))}
    </>
  );
}

export function RevenueDashboardSkeleton() {
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2].map((i) => (
          <Card key={i} className="bg-card/80 border-border/40 h-full">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <Skeleton className="h-4 w-10" />
              </div>
              <Skeleton className="h-7 w-28" />
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 bg-card/80 border-border/40">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-4">
              <Skeleton className="h-4 w-52 max-w-[70%]" />
              <Skeleton className="h-3 w-20 hidden sm:block" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <Skeleton className="h-[300px] w-full rounded-lg" />
          </CardContent>
        </Card>
        <Card className="bg-card/80 border-border/40 h-full">
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-44" />
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-1.5 w-full rounded-full ml-6" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      <Card className="bg-card/80 border-border/40">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-28" />
          </div>
        </CardHeader>
        <CardContent className="p-0 px-4 pb-4">
          <div className="space-y-0">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="flex flex-wrap items-center gap-3 py-3 border-b border-border/20 last:border-0"
              >
                <Skeleton className="h-4 flex-1 min-w-[120px] max-w-[200px]" />
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-4 w-20 ml-auto" />
                <Skeleton className="h-3 w-24 ml-auto sm:ml-0" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card className="bg-card/80 border-border/40">
        <CardHeader className="pb-3">
          <Skeleton className="h-4 w-40" />
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-28 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function AdminUserRowSkeleton() {
  return (
    <div className="rounded-lg border border-border/40 bg-secondary/20 px-4 py-3 flex items-center justify-between gap-4">
      <div className="min-w-0 space-y-2 flex-1">
        <Skeleton className="h-4 w-40 max-w-full" />
        <Skeleton className="h-3 w-56 max-w-full" />
      </div>
      <Skeleton className="h-6 w-16 rounded-full shrink-0" />
    </div>
  );
}

export function AdminUsersListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <AdminUserRowSkeleton key={i} />
      ))}
    </div>
  );
}

function AdminInviteRowSkeleton() {
  return (
    <div className="rounded-lg border border-border/40 bg-secondary/20 px-4 py-3 space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-2 flex-1 min-w-0">
          <Skeleton className="h-4 w-36 max-w-full" />
          <Skeleton className="h-3 w-64 max-w-full" />
        </div>
        <Skeleton className="h-6 w-24 rounded-full shrink-0" />
      </div>
    </div>
  );
}

export function AdminInvitesListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <AdminInviteRowSkeleton key={i} />
      ))}
    </div>
  );
}

export function CustomerDetailPageSkeleton() {
  return (
    <>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="bg-card border-border/50 h-full shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <Skeleton className="h-14 w-14 shrink-0 rounded-xl" />
              <div className="flex-1 min-w-0 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
                  <div className="flex items-center gap-3 flex-wrap min-w-0">
                    <Skeleton className="h-8 w-44 max-w-[60%]" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Skeleton className="h-4 w-10" />
                    <Skeleton className="h-5 w-9 rounded-full" />
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 gap-x-4 gap-y-2">
                  <Skeleton className="h-4 w-full max-w-[240px]" />
                  <Skeleton className="h-4 w-full max-w-[200px]" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border/50 h-full shadow-sm">
          <CardContent className="p-5 space-y-4">
            <Skeleton className="h-3 w-36" />
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-[72px] rounded-lg" />
              <Skeleton className="h-[72px] rounded-lg" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border/50 shadow-sm">
        <CardHeader className="py-3 border-b border-border/50">
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
        </CardHeader>
        <CardContent className="p-0 px-4 pb-4">
          <div className="border border-border/40 rounded-md overflow-hidden mt-2">
            <div className="grid grid-cols-[1fr_100px_80px_1fr_32px] gap-2 px-3 py-2 bg-secondary/10 border-b border-border/40">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-14" />
              <Skeleton className="h-3 w-28 ml-auto" />
              <span />
            </div>
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="grid grid-cols-[1fr_100px_80px_1fr_32px] gap-2 items-center px-3 py-2.5 border-b border-border/15 last:border-0"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Skeleton className="h-7 w-7 rounded-md shrink-0" />
                  <Skeleton className="h-4 flex-1 max-w-[140px]" />
                </div>
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-14 rounded-full" />
                <Skeleton className="h-4 w-8 ml-auto" />
                <Skeleton className="h-4 w-4 rounded shrink-0" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border/50 shadow-sm">
        <CardHeader className="py-3 border-b border-border/50">
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-4 w-44" />
            <Skeleton className="h-7 w-20 rounded-md" />
          </div>
        </CardHeader>
        <CardContent className="p-0 px-4 pb-4">
          <div className="border border-border/40 rounded-md overflow-hidden mt-2">
            <div className="grid grid-cols-4 gap-2 px-3 py-2 bg-secondary/10 border-b border-border/40">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-10" />
            </div>
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="grid grid-cols-4 gap-2 items-center px-3 py-2.5 border-b border-border/15 last:border-0"
              >
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-5 w-12 rounded-full" />
                <Skeleton className="h-3 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

export function ConversationDetailPageSkeleton() {
  return (
    <>
      <div className="space-y-1.5 mb-2">
        <Skeleton className="h-8 w-56 max-w-[min(280px,70vw)]" />
        <div className="flex items-center gap-4 flex-wrap">
          <Skeleton className="h-3 w-44" />
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px] items-start">
        <Card className="bg-card border-border/40 min-h-[520px] flex flex-col shadow-sm">
          <CardHeader className="px-5 py-4 border-b border-border/30 shrink-0">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-52 max-w-[65%]" />
              <Skeleton className="h-3 w-24" />
            </div>
          </CardHeader>
          <div className="h-[560px] md:h-[620px] overflow-hidden p-5 space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={`flex gap-3 ${i % 2 === 1 ? "flex-row-reverse" : ""}`}>
                <Skeleton className="size-7 rounded-full shrink-0 mt-0.5" />
                <div
                  className={`space-y-1.5 max-w-[82%] min-w-0 ${i % 2 === 1 ? "flex flex-col items-end" : ""}`}
                >
                  <Skeleton
                    className={`rounded-lg ${i % 2 === 0 ? "h-14 w-full max-w-md" : "h-12 w-full max-w-xs"}`}
                  />
                  <Skeleton className="h-3 w-36" />
                </div>
              </div>
            ))}
          </div>
        </Card>
        <div className="space-y-3 xl:sticky xl:top-20">
          <Card className="bg-card border-border/40 shadow-sm">
            <CardHeader className="px-4 py-3 border-b border-border/25">
              <Skeleton className="h-4 w-40" />
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between gap-3">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-32 max-w-[48%]" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
