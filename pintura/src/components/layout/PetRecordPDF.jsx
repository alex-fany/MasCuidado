import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';

// Fuente
Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf', fontWeight: 300 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 400 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 700 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-italic-webfont.ttf', fontStyle: 'italic' },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bolditalic-webfont.ttf', fontWeight: 700, fontStyle: 'italic' },
  ]
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#FFFFFF',
    fontFamily: 'Roboto',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
    borderBottom: 2,
    borderBottomColor: '#2d9b96',
    paddingBottom: 10,
  },
  logo: {
    fontSize: 24,
    fontWeight: 700,
    fontStyle: 'italic',
    color: '#2d9b96',
  },
  date: {
    fontSize: 9,
    color: '#666666',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: '#2d9b96',
    backgroundColor: '#f0f9f8',
    padding: 6,
    marginTop: 15,
    marginBottom: 8,
    textTransform: 'uppercase',
    borderRadius: 6,
    letterSpacing: 1,
  },
  petInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  infoItem: {
    width: '50%',
    marginBottom: 8,
  },
  label: {
    fontSize: 8,
    color: '#888888',
    marginBottom: 2,
    textTransform: 'uppercase',
    fontWeight: 700,
  },
  value: {
    fontSize: 10,
    color: '#333333',
  },
  medicalBox: {
    backgroundColor: '#fafafa',
    padding: 12,
    borderRadius: 10,
    border: 1,
    borderColor: '#eeeeee',
    marginBottom: 12,
  },
  table: {
    display: 'table',
    width: 'auto',
    marginTop: 5,
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#eeeeee',
    borderRadius: 10,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  tableColHeader: {
    width: '33.3%',
    backgroundColor: '#2d9b96',
  },
  tableCol: {
    width: '33.3%',
  },
  tableCellHeader: {
    margin: 6,
    fontSize: 9,
    fontWeight: 700,
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  tableCell: {
    margin: 6,
    fontSize: 9,
    color: '#444444',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 7,
    color: '#aaaaaa',
    borderTop: 1,
    borderTopColor: '#eeeeee',
    paddingTop: 10,
  }
});

const PetRecordPDF = ({ pet, t, language }) => {
  const today = new Date().toLocaleDateString(language === 'en' ? 'en-US' : language === 'pt' ? 'pt-BR' : 'es-ES');

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Cabecera */}
        <View style={styles.header}>
          <Text style={styles.logo}>+Cuidado</Text>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 13, fontWeight: 700, color: '#333' }}>{t('form_medical_record')}</Text>
            <Text style={styles.date}>{today}</Text>
          </View>
        </View>

        {/* Resumen de la Mascota */}
        <Text style={styles.sectionTitle}>{t('form_info_gen')}</Text>
        <View style={styles.petInfoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.label}>{t('form_name')}</Text>
            <Text style={styles.value}>{pet.nombre}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.label}>{t('form_species')} / {t('form_breed')}</Text>
            <Text style={styles.value}>{t(`pet_${pet.tipo.toLowerCase()}`)} {pet.raza ? `(${pet.raza})` : ''}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.label}>{t('form_age')}</Text>
            <Text style={styles.value}>{pet.edad} {language === 'en' ? 'years' : 'años'}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.label}>{t('form_weight')}</Text>
            <Text style={styles.value}>{pet.peso} kg</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.label}>{t('form_gender')}</Text>
            <Text style={styles.value}>{pet.genero === 'Macho' ? t('gender_macho') : t('gender_hembra')}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.label}>{t('form_color')} / {t('form_notes')}</Text>
            <Text style={styles.value}>{pet.color || '-'} / {pet.senasParticulares || '-'}</Text>
          </View>
        </View>

        {/* Información Clínica */}
        <Text style={styles.sectionTitle}>{t('form_info_diag')}</Text>
        <View style={styles.medicalBox}>
          <View style={{ marginBottom: 10 }}>
            <Text style={styles.label}>{t('form_conditions')}</Text>
            <Text style={styles.value}>{pet.padecimientos || t('form_none')}</Text>
          </View>
          
          <View>
            <Text style={styles.label}>{t('form_medications')}</Text>
            <Text style={styles.value}>{pet.medicamentos || t('form_none')}</Text>
          </View>
        </View>

        {/* Tabla de Vacunas */}
        <Text style={styles.sectionTitle}>{t('form_vac_scheme')}</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
            <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>{t('form_vac_name')}</Text></View>
            <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>{t('form_vac_date_apply')}</Text></View>
            <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>{t('form_vac_next_reinf')}</Text></View>
          </View>
          {pet.vacunas && pet.vacunas.length > 0 ? (
            pet.vacunas.map((v, i) => (
              <View style={[styles.tableRow, i === pet.vacunas.length - 1 ? { borderBottomWidth: 0 } : {}]} key={i}>
                <View style={styles.tableCol}><Text style={styles.tableCell}>{v.nombreVacuna}</Text></View>
                <View style={styles.tableCol}><Text style={styles.tableCell}>{new Date(v.fechaAplicacion).toLocaleDateString()}</Text></View>
                <View style={styles.tableCol}><Text style={styles.tableCell}>{v.proximaDosis ? new Date(v.proximaDosis).toLocaleDateString() : 'N/A'}</Text></View>
              </View>
            ))
          ) : (
            <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
              <View style={{ width: '100%', padding: 10 }}><Text style={[styles.tableCell, { textAlign: 'center', color: '#999' }]}>{t('form_none')}</Text></View>
            </View>
          )}
        </View>

        {/* Pie de página */}
        <Text style={styles.footer}>
          {language === 'en' 
            ? 'Document generated by +Cuidado platform. This document is for informational purposes and does not replace consultation with a licensed veterinary professional.'
            : language === 'pt'
            ? 'Documento gerado pela plataforma +Cuidado. Este documento é para fins informativos e não substitui a consulta com um profissional veterinário licenciado.'
            : 'Documento generado por la plataforma +Cuidado. Este documento es para fines informativos y no sustituye la consulta con un profesional veterinario colegiado.'
          }
        </Text>
      </Page>
    </Document>
  );
};

export default PetRecordPDF;
