from kochat.data import Dataset
from kochat.proc import GensimEmbedder, SoftmaxClassifier
from kochat.model import embed, intent, entity
from kochat.loss import CrossEntropyLoss, CRFLoss
from kochat.app import KochatApi
from kochat.app import Scenario

# 1. 데이터셋 및 임베딩, 모델 준비
dataset = Dataset(ood=True)
emb = GensimEmbedder(model=embed.FastText())
emb.fit(dataset.load_embed())

clf = SoftmaxClassifier(
    model=intent.CNN(dataset.intent_dict),
    loss=CrossEntropyLoss(dataset.intent_dict)
)
clf.fit(dataset.load_intent(emb))

rcn = entity.EntityRecognizer(
    model=entity.LSTM(dataset.entity_dict),
    loss=CRFLoss(dataset.entity_dict)
)
rcn.fit(dataset.load_entity(emb))

# 2. Scenario (시나리오) 정의
from kocrawl.weather import WeatherCrawler
weather_scenario = Scenario(
    intent='weather',
    api=WeatherCrawler().request,
    scenario={'LOCATION': [], 'DATE': ['오늘']}
)

# 3. Kochat API 서버 생성/실행
kochat = KochatApi(
    dataset=dataset,
    embed_processor=(emb, False),
    intent_classifier=(clf, False),
    entity_recognizer=(rcn, False),
    scenarios=[weather_scenario]
)

if __name__ == '__main__':
    kochat.app.template_folder = './templates'
    kochat.app.static_folder = './static'
    kochat.app.run(port=8080, host='0.0.0.0')