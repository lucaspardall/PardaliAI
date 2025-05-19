import SidebarLayout from "@/components/layout/SidebarLayout";
import ConnectStore from "@/components/dashboard/ConnectStore";
import { Helmet } from "react-helmet";

export default function ConnectStorePage() {
  return (
    <SidebarLayout title="Conectar Loja">
      <Helmet>
        <title>Conectar Loja | CIP Shopee</title>
      </Helmet>
      
      <div className="max-w-4xl mx-auto">
        <ConnectStore />
      </div>
    </SidebarLayout>
  );
}
