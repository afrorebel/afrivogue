import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MailX, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

type Status = "loading" | "valid" | "already" | "invalid" | "success" | "error";

const Unsubscribe = () => {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<Status>("loading");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!token) { setStatus("invalid"); return; }
    (async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${token}`,
          { headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY } }
        );
        const data = await res.json();
        if (!res.ok) { setStatus("invalid"); return; }
        if (data.valid === false && data.reason === "already_unsubscribed") { setStatus("already"); return; }
        setStatus("valid");
      } catch { setStatus("invalid"); }
    })();
  }, [token]);

  const handleConfirm = async () => {
    setProcessing(true);
    try {
      const { error } = await supabase.functions.invoke("handle-email-unsubscribe", { body: { token } });
      setStatus(error ? "error" : "success");
    } catch { setStatus("error"); }
    setProcessing(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full border-border">
        <CardContent className="pt-8 pb-8 text-center space-y-4">
          {status === "loading" && (
            <>
              <Loader2 className="h-10 w-10 text-gold mx-auto animate-spin" />
              <p className="font-body text-muted-foreground">Verifying…</p>
            </>
          )}
          {status === "valid" && (
            <>
              <MailX className="h-10 w-10 text-gold mx-auto" />
              <h1 className="font-display text-xl font-bold text-foreground">Unsubscribe</h1>
              <p className="font-body text-sm text-muted-foreground">
                Are you sure you want to unsubscribe from Afrivogue Pulse emails?
              </p>
              <Button onClick={handleConfirm} disabled={processing} className="w-full">
                {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Confirm Unsubscribe
              </Button>
            </>
          )}
          {status === "success" && (
            <>
              <CheckCircle className="h-10 w-10 text-green-500 mx-auto" />
              <h1 className="font-display text-xl font-bold text-foreground">Unsubscribed</h1>
              <p className="font-body text-sm text-muted-foreground">
                You've been successfully unsubscribed. You won't receive further emails from us.
              </p>
            </>
          )}
          {status === "already" && (
            <>
              <CheckCircle className="h-10 w-10 text-muted-foreground mx-auto" />
              <h1 className="font-display text-xl font-bold text-foreground">Already Unsubscribed</h1>
              <p className="font-body text-sm text-muted-foreground">
                This email is already unsubscribed.
              </p>
            </>
          )}
          {(status === "invalid" || status === "error") && (
            <>
              <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
              <h1 className="font-display text-xl font-bold text-foreground">
                {status === "invalid" ? "Invalid Link" : "Something went wrong"}
              </h1>
              <p className="font-body text-sm text-muted-foreground">
                {status === "invalid"
                  ? "This unsubscribe link is invalid or has expired."
                  : "Please try again later or contact us at contact@afrivogue.com."}
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Unsubscribe;
