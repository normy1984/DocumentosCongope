using Congope.Empresas.BussinessLogic.Genericas;
using Congope.Empresas.Data;
using Congope.Empresas.General;
using Congope.Empresas.Models.Reportes;
using iText.Layout;
using Newtonsoft.Json;
using Npgsql;
using static System.Net.Mime.MediaTypeNames;

namespace Congope.Empresas.Reportes
{
    public class RPT205_CERTIFICACION
    {
        /// <summary>
        /// Funcion para obtener la informacion CatalogoPadre
        /// </summary>
        /// <returns></returns>
        public static dynamic CargarReporte(VariablesPdfMO DatosReporte)
        {
            try
            {
                /* LA ESTRUCTURA DEL OBJETO PARA ESTE REPORTE ES:
                */

                var vReportes = new
                {
                    sig_tip = DatosReporte.param1,
                    anio = DatosReporte.param2,
                    acu_tip = DatosReporte.param3
                };


                string codEmpresa = Constantes.General.Empresa;
                NpgsqlCommand cmd = new NpgsqlCommand();

                /** CARGA LA ESTRUCTURA INICIAL DEL REPORTE **/
                string sql = @"
                select * from piepagina p 
                where trim(p.reporte)  like @nombreReporte
                and p.codemp = @codEmpresa; 
                ";
                cmd.CommandText = sql;
                cmd.Parameters.AddWithValue("@nombreReporte", "RPT205_CERTIFICACION");
                cmd.Parameters.AddWithValue("@codEmpresa", codEmpresa.ToString());
                var DatosBase = Exec_sql.cargarDatosModel<PiePaginaMO>(cmd);

                /** CARGA EL CUERPO DEL REPORTE **/



                if (DatosBase.success)
                {
                    var oReporte = DatosBase.result[0];

                    /**
                     * ORIENTACION
                     * L: landscape/Horizontal
                     * P: portrait /Vertical 
                     * */
                    oReporte.orientacion = "P";

                    /*** CONTENIDO HTML DESDE BASE DE DATOS
                             * */
                    sql = @"
                SELECT men_html from mensajes_html p 
                where p.men_codigo  = 2; 
                ";
                    cmd.CommandText = sql;
                    var DatosHtml = Exec_sql.cargarDatosJson(cmd);
                    DatosHtml = JsonConvert.DeserializeObject(DatosHtml.result);
                    string htmlContent = DatosHtml[0]["men_html"];


                    ////////////////////////////////////////////////////
                    ///DATOS DE LA CABECERA prcabmov ///////////////////
                    ////////////////////////////////////////////////////


                    sql = @"
                select 
                p.num_com,
                p.des_cab,
                (select t.descrip from tablas t where t.codtab = 2 and t.codigo = p.estado) as estado,
                (select t.descrip from tablas t where t.codtab = 54 and t.codigo = p.solicita) as solicita,
                (select t.descrip from tablas t where t.codtab = 19 and t.codigo = p.departam) as departam,
                p.fec_apr,
                p.sig_tip,
                p.acu_tip
                from prcabmov p 
                where 
                p.sig_tip = @sig_tip
                and p.anio = @anio
                and acu_tip = @acu_tip;
                ";

                    cmd.CommandText = sql;
                    cmd.Parameters.AddWithValue("@sig_tip", Convert.ToString(vReportes.sig_tip));
                    cmd.Parameters.AddWithValue("@anio", Int32.Parse(vReportes.anio));
                    cmd.Parameters.AddWithValue("@acu_tip", Int32.Parse(vReportes.acu_tip));
                    var Datosprcabmov = Exec_sql.cargarDatosJson(cmd);
                    Datosprcabmov = JsonConvert.DeserializeObject(Datosprcabmov.result);

                    htmlContent = htmlContent.Replace("##NO_COMPROBANTE##", Convert.ToString(Datosprcabmov[0]["num_com"]));
                    htmlContent = htmlContent.Replace("##CONCEPTO##", Convert.ToString(Datosprcabmov[0]["des_cab"]));
                    htmlContent = htmlContent.Replace("##FECHA_DE_APROBACION##", Convert.ToString(Datosprcabmov[0]["fec_apr"]));
                    htmlContent = htmlContent.Replace("##ESTADO##", Convert.ToString(Datosprcabmov[0]["estado"]));
                    htmlContent = htmlContent.Replace("##SOLICITADO_POR##", Convert.ToString(Datosprcabmov[0]["solicita"]));
                    htmlContent = htmlContent.Replace("##DEPARTAMENTO##", Convert.ToString(Datosprcabmov[0]["departam"]));

                    oReporte.numero_documento = $"CERTIFICACION NO.: {Convert.ToString(Datosprcabmov[0]["sig_tip"])} {Convert.ToString(Datosprcabmov[0]["acu_tip"])}";

                    ////////////////////////////////////////////////////
                    ///DATOS DEL DETALLE prdetmov 
                    ///AQUI SE CONSTRUYE EL HTML RECURSIVO///////////////////
                    ////////////////////////////////////////////////////

                    sql = @"select
                p.cuenta,
                (select nom_cue from prplacta p2 where p2.cuenta = p.cuenta and p2.anio = p.anio) as nom_cue,
                p.val_cre
                from prdetmov p
                where p.sig_tip = @sig_tip
                and P.anio = @anio
                and acu_tip = @acu_tip;";
                    cmd.CommandText = sql;
                    cmd.Parameters.AddWithValue("@sig_tip", Convert.ToString(vReportes.sig_tip));
                    cmd.Parameters.AddWithValue("@anio", Int32.Parse(vReportes.anio));
                    cmd.Parameters.AddWithValue("@acu_tip", Int32.Parse(vReportes.acu_tip));
                    var Datosprdetmov = Exec_sql.cargarDatosJson(cmd);

                    Datosprdetmov = JsonConvert.DeserializeObject(Datosprdetmov.result);


                    float Total = 0;
                    string html_detalle = "";

                    /***
                     * El estilo word-break: break-all;max-width: 35% hace que el texto se corte en un maximo 
                     * para evitar la distorsion de la presentacion
                     */

                    foreach (var item in Datosprdetmov)
                    {
                        html_detalle += $@"
                                    <tr>
                                        <td style = ""font-size: 10px; word-break: break-all; max-width: 50 %; "">{item["cuenta"]}</td>
                                        <td style = ""font-size: 10px; "">{item["nom_cue"]}</td>
                                        <td style = ""font-size: 10px; text-align: right; "">{string.Format("{0:N2}", item["val_cre"])}</td>
                                    </tr>";
                        Total = Total + Convert.ToSingle(item["val_cre"]);
                    }


                    //REEMPLAZO DEL TOTAL
                    htmlContent = htmlContent.Replace("##DETALLE_RECURSIVO##", Convert.ToString(html_detalle));
                    htmlContent = htmlContent.Replace("##VALOR_TOTAL##", string.Format("{0:N2}", Total));

                    oReporte.cuerpo_reporte = htmlContent;
                    
                    return PdfBL.GenerarPDFBase64(oReporte);
                   

                }
                else
                {
                    return DatosBase;
                }
            }
            catch (Exception e)
            {
                SeguridadBL.WriteErrorLog(e);
                return new
                {
                    success = false,
                    message = "Error: " + e.Message,
                    result = ""
                };
            }


        }
    }
}
