import { prisma } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CustomerForm } from '../../_components/customer-form';
import { notFound } from 'next/navigation';

interface EditCustomerPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditCustomerPage({ params }: EditCustomerPageProps) {
  const resolvedParams = await params;
  const customer = await prisma.customer.findUnique({
    where: { id: resolvedParams.id },
  });

  if (!customer) {
    return notFound();
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Edit Customer</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomerForm customer={customer} />
        </CardContent>
      </Card>
    </div>
  );
}
