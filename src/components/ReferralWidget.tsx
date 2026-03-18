import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Copy, Users, Check } from "lucide-react";

const ReferralWidget = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const referralLink = user
    ? `${window.location.origin}/auth?ref=${user.id}`
    : "";

  const { data: referrals = [] } = useQuery({
    queryKey: ["my-referrals", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("referrals")
        .select("*, profiles:referred_id(display_name)")
        .eq("referrer_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({ title: "Copied!", description: "Referral link copied to clipboard." });
    setTimeout(() => setCopied(false), 2000);
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="flex items-center gap-2 font-display text-lg font-bold text-foreground mb-2">
          <Users className="h-5 w-5 text-gold" /> Invite Friends
        </h3>
        <p className="font-body text-sm text-muted-foreground mb-4">
          Share your referral link and earn 50 points for each friend who joins.
        </p>
        <div className="flex gap-2">
          <Input value={referralLink} readOnly className="font-body text-xs" />
          <Button onClick={copyLink} variant="outline" className="border-gold/30 text-gold hover:bg-gold/10 gap-1.5 shrink-0">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      </div>

      {referrals.length > 0 && (
        <div>
          <h4 className="font-display text-sm font-bold text-foreground mb-3">Your Referrals ({referrals.length})</h4>
          <div className="space-y-2">
            {referrals.map((ref: any) => (
              <div key={ref.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                <span className="font-body text-sm text-foreground">
                  {ref.profiles?.display_name || "New member"}
                </span>
                <span className="font-body text-xs text-muted-foreground">
                  {new Date(ref.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReferralWidget;
