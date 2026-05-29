import { GetStaticProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useTranslation } from 'next-i18next';
import Layout from '@/components/layouts/admin';
import { adminOnly } from '@/utils/auth-utils';
import PageHeading from '@/components/common/page-heading';
import Card from '@/components/common/card';
import ImageGeneratorForm from '@/components/image-generator/image-generator-form';
import ImageGeneratorBatch from '@/components/image-generator/image-generator-batch';

export default function ImageGeneratorPage() {
  const { t } = useTranslation('common');

  return (
    <>
      <PageHeading title={t('text-image-generator')} />

      <Card className="mb-8 p-6">
        <ImageGeneratorForm />
      </Card>

      <Card className="p-6">
        <ImageGeneratorBatch />
      </Card>
    </>
  );
}

ImageGeneratorPage.authenticate = { permissions: adminOnly };
ImageGeneratorPage.Layout = Layout;

export const getStaticProps: GetStaticProps = async ({ locale }) => ({
  props: {
    ...(await serverSideTranslations(locale!, ['table', 'common', 'form'])),
  },
});
