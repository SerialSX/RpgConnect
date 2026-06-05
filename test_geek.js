const html = `<tr id='row_'>		
			<td class='collection_rank' align='center' >
			<a name="53"></a>			53			
					</td>		
						
		
			<td class='collection_thumbnail'>
			<a   href="/rpgitem/161984/dungeons-and-dragons-starter-set" ><img alt="RPG Item: Dungeons & Dragons Starter Set" src="https://cf.geekdo-images.com/lA5vnLqK2_MJ5dubTZ8Dew__micro/img/NcKRFlMJ8uH-LqVQTwnzI2S8MXk=/fit-in/64x64/filters:strip_icc()/pic2073834.jpg"></a>
		</td>
		
			<td id='CEcell_objectname1' class="collection_objectname browse">
	<div id='status_objectname1'></div>
	<div id='results_objectname1' style='z-index:1000;' onclick=''>
					<a  href="/rpgitem/161984/dungeons-and-dragons-starter-set"  class='primary' >Dungeons & Dragons Starter Set</a>
							<span class='smallerfont dull'>(2014)</span>
	</div>
	</td>
	</tr>`;

const rows = html.split("<tr id='row_'>");
const results = [];

for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    
    // Extract ID and Name
    const linkMatch = row.match(/href=["']\/rpgitem\/(\d+)\/([^"']*)["']\s+class=['"]primary['"]\s*>(.*?)<\/a>/is);
    console.log("linkMatch:", !!linkMatch);
    if (!linkMatch) continue;
    
    const id = linkMatch[1];
    const slug = linkMatch[2];
    const nome = linkMatch[3].replace(/<[^>]*>/g, '').trim();
    
    // Extract thumbnail image
    const thumbTdMatch = row.match(/class=['"]collection_thumbnail['"][\s\S]*?<img[\s\S]*?src=['"]([^'"]+)['"]/is);
    const imagem = thumbTdMatch ? thumbTdMatch[1] : "";
    
    // Extract Year
    const yearMatch = row.match(/<span class=['"]smallerfont dull['"]>\((.*?)\)<\/span>/is);
    const ano = yearMatch ? yearMatch[1] : "";
    
    results.push({ id, nome, slug, ano, imagem });
}
console.log(results);
